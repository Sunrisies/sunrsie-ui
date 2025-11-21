#!/usr/bin/env node

import { execSync, spawn } from "child_process";
import * as readline from "readline";
import * as fs from "fs";
import * as path from "path";
import chalk from "chalk";
import figlet from "figlet";
import { program } from "commander";

interface Commit {
  hash: string;
  shortHash: string;
  author: string;
  date: string;
  relativeDate: string;
  message: string;
  branch?: string;
}

class GitCommitModifier {
  private rl: readline.Interface;
  private currentNumber: number;
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    this.currentNumber = 10;
  }

  // 检查是否为 Git 仓库
  private isGitRepository(): boolean {
    try {
      execSync("git rev-parse --git-dir", { stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  }

  // 获取最近的提交列表
  private getRecentCommits(limit: number = 20): Commit[] {
    try {
      const format = "%H|%h|%an|%ad|%ar|%s";
      const output = execSync(
        `git log --oneline --pretty=format:"${format}" --date=format:"%Y-%m-%d %H:%M:%S" -${limit}`,
        { encoding: "utf-8" }
      );

      return output
        .trim()
        .split("\n")
        .map((line) => {
          const [hash, shortHash, author, date, relativeDate, ...messageParts] =
            line.split("|");
          const message = messageParts.join("|");

          return {
            hash,
            shortHash,
            author,
            date,
            relativeDate,
            message,
          };
        });
    } catch (error) {
      throw new Error("无法获取提交列表");
    }
  }

  // 获取当前分支信息
  private getCurrentBranch(): string {
    try {
      return execSync("git branch --show-current", {
        encoding: "utf-8",
      }).trim();
    } catch {
      return "unknown";
    }
  }

  // 验证提交哈希是否存在
  private validateCommitHash(hash: string): boolean {
    try {
      execSync(`git cat-file -t ${hash}`, { stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  }

  // 验证日期格式
  private validateDate(dateString: string): boolean {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }

  // 转换日期格式为 Git 需要的格式
  private convertToGitDateFormat(dateString: string): string {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new Error("无效的日期格式");
    }
    // 使用ISO格式，确保时区信息正确
    return date.toISOString();
  }

  // 显示提交列表（美化输出）
  private displayCommits(commits: Commit[], currentBranch: string): void {
    console.log("\n" + chalk.cyan("📚 最近的提交记录"));
    console.log(
      chalk.gray("══════════════════════════════════════════════════")
    );

    commits.forEach((commit, index) => {
      const isCurrentBranch = commit.hash.startsWith(
        execSync(`git rev-parse HEAD`, { encoding: "utf-8" }).trim()
      );

      const branchIndicator = isCurrentBranch
        ? chalk.green("🟢 ")
        : chalk.gray("⚪ ");

      const indexStr = chalk.yellow(
        `${(index + 1).toString().padStart(2, " ")}.`
      );
      const hashStr = chalk.cyan(`(${commit.shortHash})`);
      const authorStr = chalk.magenta(commit.author);
      const dateStr = chalk.blue(commit.date);
      const relativeStr = chalk.gray(`(${commit.relativeDate})`);
      const messageStr = chalk.white(commit.message);

      console.log(
        `${branchIndicator}${indexStr} ${hashStr} ${authorStr} | ${dateStr} ${relativeStr}`
      );
      console.log(`    ${chalk.gray("└─")} ${messageStr}\n`);
    });

    console.log(chalk.gray(`当前分支: ${chalk.green(currentBranch)}`));
    console.log(
      chalk.gray("══════════════════════════════════════════════════")
    );
  }

  // 显示提交详情
  private displayCommitDetails(commit: Commit): void {
    console.log("\n" + chalk.cyan("📝 提交详情"));
    console.log(
      chalk.gray("──────────────────────────────────────────────────")
    );
    console.log(`${chalk.yellow("哈希:")}    ${commit.hash}`);
    console.log(`${chalk.yellow("短哈希:")}  ${commit.shortHash}`);
    console.log(`${chalk.yellow("作者:")}    ${chalk.magenta(commit.author)}`);
    console.log(
      `${chalk.yellow("日期:")}    ${chalk.blue(commit.date)} ${chalk.gray(
        `(${commit.relativeDate})`
      )}`
    );
    console.log(`${chalk.yellow("信息:")}    ${commit.message}`);
    console.log(
      chalk.gray("──────────────────────────────────────────────────")
    );
  }

  // 检查是否安装了 git-filter-repo
  private checkGitFilterRepo(): boolean {
    try {
      execSync("git filter-repo --version", { stdio: "ignore" });
      return true;
    } catch {
      console.log(chalk.red("❌ 错误: 未安装 git-filter-repo"));
      console.log(chalk.yellow("💡 请安装 git-filter-repo:"));
      console.log(chalk.gray("  pip3 install git-filter-repo")); 
      console.log(chalk.gray("  或访问: https://github.com/newren/git-filter-repo"));
      return false;
    }
  }

  // 创建临时脚本文件
  private createTempScript(commitHash: string, gitDate: string): string {
    const scriptContent = `
def commit_callback(commit):
    if commit.original_id.startswith(b"${commitHash}"):
        commit.author_date = b"${gitDate}"
        commit.committer_date = b"${gitDate}"
    return commit
`;
    
    const tempDir = path.join(process.cwd(), ".git", "filter-repo");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const scriptPath = path.join(tempDir, "commit-callback.py");
    fs.writeFileSync(scriptPath, scriptContent);
    return scriptPath;
  }

  // 清理临时文件
  private cleanupTempScript(scriptPath: string): void {
    try {
      if (fs.existsSync(scriptPath)) {
        fs.unlinkSync(scriptPath);
      }
      
      const tempDir = path.join(process.cwd(), ".git", "filter-repo");
      if (fs.existsSync(tempDir) && fs.readdirSync(tempDir).length === 0) {
        fs.rmdirSync(tempDir);
      }
    } catch (error) {
      console.log(chalk.yellow("⚠️ 清理临时文件时出错:"), error);
    }
  }

  // 修改提交时间
  private async modifyCommitDate(
    commitHash: string,
    newDate: string
  ): Promise<boolean> {
    // 检查是否安装了 git-filter-repo
    if (!this.checkGitFilterRepo()) {
      return false;
    }

    let gitDate: string;
    let scriptPath: string | undefined;
    
    try {
      gitDate = this.convertToGitDateFormat(newDate);
      scriptPath = this.createTempScript(commitHash, gitDate);

      console.log(chalk.yellow("\n🔄 正在修改提交时间..."));
      console.log(chalk.gray(`提交: ${commitHash}`));
      console.log(chalk.gray(`新时间: ${newDate}`));
      console.log(chalk.gray(`Git格式: ${gitDate}`));

      // 使用 git filter-repo
      const child = spawn("git", [
        "filter-repo",
        "--force",
        "--commit-callback",
        scriptPath
      ]);

      return new Promise((resolve) => {
        child.stdout.on("data", (data) => {
          process.stdout.write(chalk.gray(data.toString()));
        });

        child.stderr.on("data", (data) => {
          process.stderr.write(chalk.red(data.toString()));
        });

        child.on("close", (code) => {
          // 清理临时文件
          if (scriptPath) {
            this.cleanupTempScript(scriptPath);
          }
          
          if (code === 0) {
            console.log(chalk.green("\n✅ 提交时间修改成功！"));
            console.log(chalk.yellow("💡 提示: 如果需要推送到远程仓库，请使用:"));
            console.log(chalk.gray("  git push --force-with-lease"));
            resolve(true);
          } else {
            console.log(chalk.red("\n❌ 提交时间修改失败！"));
            resolve(false);
          }
        });

        child.on("error", (error) => {
          // 清理临时文件
          if (scriptPath) {
            this.cleanupTempScript(scriptPath);
          }
          console.log(chalk.red("\n❌ 执行过程中发生错误:"), error);
          resolve(false);
        });
      });
    } catch (error) {
      // 确保清理临时文件
      if (scriptPath) {
        this.cleanupTempScript(scriptPath);
      }
      console.log(chalk.red("\n❌ 执行过程中发生错误:"), error);
      return false;
    }
  }

  // 显示标题
  private displayHeader(): void {
    console.log(
      chalk.cyan(
        figlet.textSync("Git Time Machine", { horizontalLayout: "full" })
      )
    );
    console.log(chalk.gray("Git提交时间修改工具 - 交互式版本\n"));
  }

  // 提问函数
  private question(query: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(query, resolve);
    });
  }

  // 非交互式模式
  private async nonInteractiveMode(
    commitHash: string,
    newDate: string
  ): Promise<void> {
    if (!this.isGitRepository()) {
      console.log(chalk.red("❌ 错误: 当前目录不是 Git 仓库"));
      process.exit(1);
    }

    if (!this.validateCommitHash(commitHash)) {
      console.log(chalk.red(`❌ 错误: 提交哈希 "${commitHash}" 不存在`));
      process.exit(1);
    }

    if (!this.validateDate(newDate)) {
      console.log(chalk.red(`❌ 错误: 日期格式 "${newDate}" 无效`));
      console.log(chalk.yellow('💡 提示: 请使用格式 "2025-10-02 9:20:21"'));
      process.exit(1);
    }

    // 检查是否安装了 git-filter-repo
    if (!this.checkGitFilterRepo()) {
      process.exit(1);
    }

    const success = await this.modifyCommitDate(commitHash, newDate);
    process.exit(success ? 0 : 1);
  }

  // 交互式模式
  private async interactiveMode(): Promise<void> {
    this.displayHeader();

    if (!this.isGitRepository()) {
      console.log(chalk.red("❌ 错误: 当前目录不是 Git 仓库"));
      process.exit(1);
    }
    
    // 检查是否安装了 git-filter-repo
    if (!this.checkGitFilterRepo()) {
      process.exit(1);
    }

    const currentBranch = this.getCurrentBranch();
    let commits = this.getRecentCommits(this.currentNumber);

    while (true) {
      try {
        commits = this.getRecentCommits(this.currentNumber); // 刷新列表
        this.displayCommits(commits, currentBranch);

        console.log(chalk.cyan("🎯 请选择操作:"));
        console.log("1. 📝 输入提交哈希进行修改");
        console.log("2. 🔢 通过序号选择提交");
        console.log("3. 🔄 刷新提交列表");
        console.log("4. ❌ 退出程序");

        const choice = await this.question(
          "\n" + chalk.yellow("👉 请选择 [1-4]: ")
        );

        switch (choice.trim()) {
          case "1":
            await this.handleHashInput();
            break;
          case "2":
            await this.handleIndexSelection(commits);
            break;
          case "3":
            console.log(chalk.green("🔄 刷新提交列表..."));
            break;
          case "4":
            console.log(chalk.gray("👋 再见！"));
            this.rl.close();
            return;
          default:
            console.log(chalk.red("❌ 错误: 无效选择，请输入 1-4"));
        }

        await this.question(chalk.gray("\n⏎ 按回车键继续..."));
        console.clear();
      } catch (error) {
        console.log(chalk.red("\n❌ 发生错误:"), error);
        const retry = await this.question(chalk.yellow("🔄 是否继续？(Y/n): "));
        if (retry.trim().toLowerCase() === "n") {
          console.log(chalk.gray("👋 再见！"));
          this.rl.close();
          return;
        }
        console.clear();
      }
    }
  }

  // 处理哈希输入
  private async handleHashInput(): Promise<void> {
    const commitHash = await this.question(
      chalk.yellow("🔑 请输入提交哈希值: ")
    );
    const trimmedHash = commitHash.trim();

    if (!trimmedHash) {
      console.log(chalk.red("❌ 错误: 提交哈希值不能为空"));
      return;
    }

    if (!this.validateCommitHash(trimmedHash)) {
      console.log(chalk.red(`❌ 错误: 提交哈希 "${trimmedHash}" 不存在`));
      return;
    }

    await this.processDateInput(trimmedHash);
  }

  // 处理序号选择
  private async handleIndexSelection(commits: Commit[]): Promise<void> {
    const indexInput = await this.question(
      chalk.yellow(`🔢 请输入提交序号 (1-${this.currentNumber}): `)
    );
    const index = parseInt(indexInput.trim());

    if (isNaN(index) || index < 1 || index > commits.length) {
      console.log(chalk.red(`❌ 错误: 请输入 1-${commits.length} 之间的数字`));
      return;
    }

    const selectedCommit = commits[index - 1];
    this.displayCommitDetails(selectedCommit);

    const confirm = await this.question(
      chalk.yellow("✅ 确认修改这个提交？(y/N): ")
    );
    if (confirm.trim().toLowerCase() === "y") {
      await this.processDateInput(selectedCommit.hash);
    }
  }

  // 处理日期输入
  private async processDateInput(commitHash: string): Promise<void> {
    while (true) {
      try {
        const newDate = await this.question(
          chalk.yellow("📅 请输入新的日期时间 (格式: ") +
            chalk.white("2025-10-02 9:20:21") +
            chalk.yellow("): ")
        );

        const trimmedDate = newDate.trim();

        if (!trimmedDate) {
          console.log(chalk.red("❌ 错误: 日期不能为空"));
          continue;
        }

        if (!this.validateDate(trimmedDate)) {
          console.log(chalk.red("❌ 错误: 日期格式无效"));
          console.log(chalk.yellow('💡 提示: 请使用 "YYYY-MM-DD HH:MM:SS" 格式'));
          continue;
        }

        // 先显示将要进行的修改，让用户确认
        console.log(chalk.yellow("\n⚠️ 即将修改提交时间:"));
        console.log(chalk.gray(`提交: ${commitHash}`));
        console.log(chalk.gray(`新时间: ${trimmedDate}`));
        
        const confirm = await this.question(
          chalk.yellow("✅ 确认修改？(y/N): ")
        );
        
        if (confirm.trim().toLowerCase() !== "y") {
          console.log(chalk.gray("❌ 操作已取消"));
          break;
        }

        const success = await this.modifyCommitDate(commitHash, trimmedDate);
        if (success) {
          break;
        } else {
          const retry = await this.question(chalk.yellow("🔄 是否重试？(y/N): "));
          if (retry.trim().toLowerCase() !== "y") {
            break;
          }
        }
      } catch (error) {
        console.log(chalk.red("\n❌ 处理日期时发生错误:"), error);
        const retry = await this.question(chalk.yellow("🔄 是否重试？(y/N): "));
        if (retry.trim().toLowerCase() !== "y") {
          break;
        }
      }
    }
  }

  // 主函数
  async run(): Promise<void> {
    try {
      program
        .name("git-time-machine")
        .description("Git提交时间修改工具 - TypeScript版本")
        .version("1.0.0")
        .argument("[commit-hash]", "要修改的提交哈希")
        .argument("[new-date]", "新的日期时间 (格式: 2025-10-02 9:20:21)")
        .option("-n, --number <number>", "显示的提交数量", "20")
        .action(async (commitHash?: string, newDate?: string, options?: any) => {
          // 设置显示的提交数量
          if (options?.number) {
            const num = parseInt(options.number);
            if (!isNaN(num) && num > 0 && num <= 100) {
              this.currentNumber = num;
            }
          }
          
          if (commitHash && newDate) {
            await this.nonInteractiveMode(commitHash, newDate);
          } else if (commitHash || newDate) {
            console.log(chalk.red("❌ 错误: 必须同时提供提交哈希和日期参数"));
            console.log(chalk.yellow("💡 使用示例:"));
            console.log(chalk.gray("  git-time-machine abc123 2023-01-01 12:00:00"));
            console.log(chalk.gray("  git-time-machine # 交互式模式"));
            process.exit(1);
          } else {
            await this.interactiveMode();
          }
        });

      await program.parseAsync(process.argv);
    } catch (error) {
      console.log(chalk.red("\n❌ 程序执行出错:"), error);
      process.exit(1);
    }
  }
}

// 运行程序
const app = new GitCommitModifier();
app.run().catch(console.error);

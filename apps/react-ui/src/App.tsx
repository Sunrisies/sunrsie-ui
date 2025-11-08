import { Button } from 'sunrise/ui'
import './App.css'
import { genRandStr } from "sunrise-utils"

function App() {
  console.log(genRandStr(100))
  return (
    <>
      <Button></Button>
      按钮
    </>
  )
}

export default App

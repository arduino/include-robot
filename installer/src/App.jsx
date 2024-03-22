import { useEffect, useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/tauri";
import { Command } from '@tauri-apps/api/shell'

import "./App.css";


function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [version, setVersion] = useState("")
  const [name, setName] = useState("");
  const [boards, setBoards] = useState([])
  const [selectedBoard, setSelectedBoard] = useState("")
  const [uploading, setUploading] = useState(false);

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
    setGreetMsg(await invoke("greet", { name }));
  }

  useEffect(() => {
    const getVersion = async () => {
      const command = Command.sidecar('../resources/arduino-cli/arduino-cli', [
        'version',
        '--format',
        'json'
      ])
      const output = await command.execute()
      const versionObject = JSON.parse(output.stdout)
      setVersion(`${versionObject.VersionString} - ${versionObject.Date}`)
    }

    getVersion().catch(console.error)

  }, [])

  useEffect(() => {
    const getBoards = async (fqbn_list) => {
      const command = Command.sidecar('../resources/arduino-cli/arduino-cli', [
        'board',
        'list',
        '--format',
        'json'
      ])
      const output = await command.execute()
      const boardList = JSON.parse(output.stdout)

      let boards = boardList
        .filter(row => row['matching_boards']?.find(o => fqbn_list.includes(o['fqbn'])))
        .map(board => ({
          name: board['matching_boards'][0]["name"],
          fqbn: board['matching_boards'][0]["fqbn"],
          port: board['port']["address"],
        }))

      setBoards(boards)
    }

    getBoards(['arduino:mbed_nano:nano33ble']).catch(console.error)
  })

  const upload = async () => {
    setUploading(true)

    let board = boards.find(x => x.name === selectedBoard)


    let dstPath = await invoke("append_config", { binPath: "../resources/sketch.bin", config: { ble_name: "xxx", left_servo: 3, right_servo: 4 } }).catch(console.error);

    console.log("upload binary", dstPath, "to", board);

    const command = Command.sidecar('../resources/arduino-cli/arduino-cli', [
      'upload',
      '-v',
      "-i",
      dstPath,
      '-b',
      board.fqbn,
      '-p',
      board.port,
    ])
    const output = await command.execute().catch(console.error)
    console.log(output)

    setUploading(false)
  }

  return (
    <div className="container">
      <h1>Welcome to Tauri!</h1>

      <div className="row">
        <a href="https://vitejs.dev" target="_blank">
          <img src="/vite.svg" className="logo vite" alt="Vite logo" />
        </a>
        <a href="https://tauri.app" target="_blank">
          <img src="/tauri.svg" className="logo tauri" alt="Tauri logo" />
        </a>
        <a href="https://reactjs.org" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>

      <p>Click on the Tauri, Vite, and React logos to learn more.</p>

      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          greet();
        }}
      >
        <input
          id="greet-input"
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Enter a name..."
        />
        <button type="submit">Greet</button>
      </form>

      <p>{greetMsg}</p>

      <h2 className="text-3xl font-bold underline">Arduino CLI</h2>
      <p>{version}</p>

      <h2 className="text-3xl font-bold underline">Boards</h2>
      <ul>
        {boards.map((x, index) => (
          <li key={index}>
            <input type="radio" name="option"
              value={x.name}
              onChange={(e) => setSelectedBoard(e.target.value)} />
            <label>{x.name}</label>
          </li>
        ))}
      </ul>

      {uploading && <p>Uploading...</p>}

      <button type="submit" onClick={upload}>Upload</button>

    </div>
  );
}

export default App;

import { invoke } from '@tauri-apps/api/tauri';
import { useEffect, useReducer, useRef, useState } from 'react';
import FormControl from './components/FormControl';
import LoadingButton from './components/LoadingButton';
import reducer from './reducers/state-reducer';
import supportedBoards from './supported-boards';
import {
    getBoards,
    getVersion as getVersionFromCLI,
    upload,
    installRequiredCores,
} from './services/arduino-cli';

import './App.css';

function App() {
    // these properties are not part of the "internal state" of the component (preferential)
    const [version, setVersion] = useState('');
    const [name, setName] = useState('');
    const [leftServo, setLeftServo] = useState(3);
    const [rightServo, setRightServo] = useState(4);

    const textAreaRef = useRef(null);
    const initialState = {
        stdout: '', // stdout (or stderr) as provided by the arduino-cli
        code: null, // code as provided by the arduino-cli
        boards: [],
        selectedBoard: null,
        uploading: false,
        uploadButtonEnabled: false,
        error: null,
    };

    const [state, dispatch] = useReducer(reducer, initialState);

    const handleError = (error) => dispatch({ type: 'GENERIC_ERROR', error });

    useEffect(() => {
        textAreaRef.current.scrollTop = textAreaRef.current.scrollHeight;
    }, [state.stdout]);

    /* writes the version of the CLI at mount time */
    useEffect(() => {
        const writeVersion = async () => {
            const versionString = await getVersionFromCLI();
            setVersion(versionString);
        };
        writeVersion().catch(handleError);
    }, []);

    /* Checking if there are connected boards every 3 seconds */
    useEffect(() => {
        const interval = setInterval(async () => {
            await getBoards({
                fqbnList: supportedBoards.map(
                    (supportedBoard) => supportedBoard.fqbn
                ),
                onBoardRetrieved: (connectedBoards) =>
                    dispatch({
                        type: 'BOARDS_RETRIEVED',
                        boards: connectedBoards,
                    }),
                onBoardDisconnected: () =>
                    dispatch({ type: 'BOARDS_DISCONNECTED' }),
                onError: handleError,
            });
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    const updateLeftServo = (ev) => {
        setLeftServo(ev.currentTarget.value);
    };
    const updateRightServo = (ev) => {
        setRightServo(ev.currentTarget.value);
    };

    const updateName = (ev) => {
        setName(ev.currentTarget.value);
    };

    const onData = (line) => dispatch({ type: 'APPEND_STDOUT', stdout: line });

    const onUploadFinished = (data) => {
        if (data.code === 0) {
            dispatch({
                type: 'UPLOAD_COMPLETE',
                code: data.code, // atm code is not used
            });
        } else {
            dispatch({
                type: 'GENERIC_ERROR',
                error: new Error('Error uploading sketch'),
            });
        }
    };

    const asyncUpload = async () => {
        dispatch({ type: 'UPLOAD_STARTED' });
        let board;
        let dstPath;
        try {
            board = state.boards.find((x) => x.name === state.selectedBoard);
            dstPath = await invoke('append_config', {
                binPath: '../resources/sketch.bin',
                config: {
                    ble_name: name,
                    left_servo: leftServo,
                    right_servo: rightServo,
                },
            });
        } catch (error) {
            handleError(error);
            return;
        }

        dispatch({
            type: 'APPEND_STDOUT',
            stdout: 'Checking installed Arduino cores',
        });

        try {
            await installRequiredCores({
                // `...new Set()` removes duplicate plaforms
                fqbnList: [
                    ...new Set(
                        supportedBoards.map(
                            (supportedBoard) => supportedBoard.platform
                        )
                    ),
                ],
                onData,
            });
        } catch (error) {
            handleError(error);
            return;
        }

        const uploadMsg = `Uploading binary ${dstPath.split(/.*[/|\\]/)[1]} to ${board.port}\n`;
        dispatch({ type: 'APPEND_STDOUT', stdout: uploadMsg });

        try {
            await upload({
                dstPath,
                fqbn: board.fqbn,
                port: board.port,
                onData,
                onClose: onUploadFinished,
                onError: handleError,
            });
        } catch (error) {
            handleError(error);
        }
    };

    const selectBoard = (ev) => {
        const selectedBoard = ev.target.value;
        dispatch({ type: 'BOARDS_SELECTED', selectedBoard });
    };

    return (
        <div className="container mx-auto overflow-hidden w-full bg-gray-800 h-screen">
            <div className=" max-w-5xl mx-auto px-6 sm:px-6 lg:px-8 pt-12 mb-12">
                <div className="bg-gray-900 w-full shadow rounded p-8 sm:p-12">
                    <p className="text-3xl font-bold leading-7 mb-8 text-center text-white select-none">
                        <img
                            className="inline-block mr-4"
                            src="./128x128.png"
                            alt="Myra Robot logo"
                            height="48"
                            width="48"
                        />
                        Myra Robot Installer
                    </p>

                    <p className="text-center text-lg font-bold text-white select-none">
                        Install the software you need to interact with Scratch
                        via Bluetooth (BLE) on your Arduino
                    </p>
                    <p className="text-center my-2 text-base text-white select-none">
                        Check out{' '}
                        <a
                            className="underline"
                            href="https://labs.arduino.cc/en/labs/include-robot"
                            target="_blank"
                            rel="noreferrer noopener"
                        >
                            our documentation
                        </a>
                    </p>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            asyncUpload();
                        }}
                    >
                        <FormControl
                            onChange={updateName}
                            value={name}
                            type="text"
                            name="name"
                            label="Name"
                            tooltip="It will be used to identify the Bluetooth name of this robot, as shown in Scratch. If not specified, a default name will be used"
                        />
                        <FormControl
                            onChange={updateLeftServo}
                            value={leftServo}
                            type="number"
                            name="leftServo"
                            label="Left Servo Pin"
                            tooltip="The PIN number of the left servo motor"
                        />
                        <FormControl
                            onChange={updateRightServo}
                            value={rightServo}
                            type="number"
                            name="rightServo"
                            label="Right Servo Pin"
                            tooltip="The PIN number of the right servo motor"
                        />

                        <fieldset>
                            <div className="flex flex-row items-start gap-4 mt-4">
                                <div className="w-1/3 text-right">
                                    <legend className="select-none w-full text-base font-semibold text-gray-300">
                                        Available boards
                                        <span className="ml-2 text-red-600">
                                            *
                                        </span>
                                    </legend>
                                </div>
                                <div className="md:w-2/3 pt-[0.3rem]">
                                    {state.boards.length ? (
                                        state.boards.map((board) => (
                                            <div
                                                className="flex items-center mb-4"
                                                key={board.fqbn}
                                            >
                                                <input
                                                    value={board.name}
                                                    onChange={selectBoard}
                                                    id={`board - option - ${board.fqbn} `}
                                                    type="radio"
                                                    name="countries"
                                                    className="h-4 w-5 border-gray-300 focus:ring-2 focus:ring-blue-300 mr-2"
                                                    aria-labelledby={`board - option - ${board.fqbn} `}
                                                    aria-describedby={`board - option - ${board.fqbn} `}
                                                />
                                                <label
                                                    htmlFor={`board - option - ${board.fqbn} `}
                                                    className="select-none w-full text-base font-semibold leading-none text-gray-300"
                                                >
                                                    {board.name}
                                                </label>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="italic select-none w-full leading-none text-gray-600">
                                            No boards found
                                        </div>
                                    )}
                                </div>
                            </div>
                        </fieldset>
                        <div className="flex flex-row items-start gap-4">
                            <div className="w-1/3 text-right" />
                            <div className="md:w-2/3 pt-1">
                                <LoadingButton
                                    loading={state.uploading}
                                    enabled={state.uploadButtonEnabled}
                                />
                            </div>
                        </div>
                    </form>
                    {state.error && (
                        <p className="text-red-600 container mx-auto">
                            {state.error?.message}
                        </p>
                    )}
                    <textarea
                        ref={textAreaRef}
                        rows={6}
                        value={state.stdout}
                        readOnly
                        disabled
                        tabIndex={-1}
                        className={`resize-none w-full text-gray-50 px-3 py-2 mt-4 border-0 bg-gray-800 rounded font-mono leading-3 text-xs ${state.code && 'border border-red-500'}`}
                    />
                </div>
                <div className="w-full text-right text-gray-600 ">
                    Arduino CLI version: {version}
                </div>
            </div>
        </div>
    );
}

export default App;

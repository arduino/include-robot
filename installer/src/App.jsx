import { Command } from '@tauri-apps/api/shell';
import { invoke } from '@tauri-apps/api/tauri';
import { useEffect, useReducer, useState } from 'react';
import { Tooltip } from 'react-tooltip';
import capitalize from './utils/capitalize';

import './App.css';
import reducer from './reducers/state-reducer';

const getBoards = async (fqbn_list) => {
    const command = Command.sidecar('../resources/arduino-cli/arduino-cli', [
        'board',
        'list',
        '--format',
        'json',
    ]);
    const output = await command.execute();
    const boardList = JSON.parse(output.stdout);
    console.log('******** BEGIN: app:34 ********');
    console.dir(boardList, { depth: null, colors: true });
    console.log('********   END: app:34 ********');
    return boardList
        .filter((row) =>
            row['matching_boards']?.find((o) => fqbn_list.includes(o['fqbn']))
        )
        .map((board) => ({
            name: board['matching_boards'][0]['name'],
            fqbn: board['matching_boards'][0]['fqbn'],
            port: board['port']['address'],
        }));
};

function App() {
    // these properties are not part of the "internal state" of the component
    const [version, setVersion] = useState('');
    const [name, setName] = useState('');
    const [leftServo, setLeftServo] = useState('3');
    const [rightServo, setRightServo] = useState('4');

    const initialState = {
        stdout: '', // stdout as provided by the arduino-cli
        code: null, // code as provided by the arduino-cli
        boards: [],
        selectedBoard: null,
        uploading: false,
        uploadButtonEnabled: false,
        error: null,
    };

    const [state, dispatch] = useReducer(reducer, initialState);

    const handleError = (error) => {
        dispatch({ type: 'GENERIC_ERROR', error });
    };

    useEffect(() => {
        const getVersion = async () => {
            const command = Command.sidecar(
                '../resources/arduino-cli/arduino-cli',
                ['version', '--format', 'json']
            );
            const output = await command.execute();
            const versionObject = JSON.parse(output.stdout);
            setVersion(
                `${versionObject.VersionString} - ${versionObject.Date} `
            );
        };

        getVersion().catch(handleError);
    }, []);

    /* Checking if there are connected boards every 3 seconds */
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const connectedBoards = await getBoards([
                    'arduino:mbed_nano:nano33ble',
                ]);
                if (connectedBoards.length > 0) {
                    dispatch({
                        type: 'BOARDS_RETRIEVED',
                        boards: connectedBoards,
                    });
                } else {
                    dispatch({ type: 'BOARDS_DISCONNECTED' });
                }
            } catch (error) {
                console.error(error);
            }
        }, 3000);

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
    const upload = async () => {
        dispatch({ type: 'UPLOAD_STARTED' });
        let board;
        let dstPath;
        try {
            board = state.boards.find((x) => x.name === state.selectedBoard);
            dstPath = await invoke('append_config', {
                binPath: '../resources/sketch.bin',
                ble_name: name,
                cfg: name, // legacy, remove when msgpack stuff is completed
                left_servo: leftServo,
                rightServo: rightServo,
            });
        } catch (error) {
            handleError(error);
            return;
        }

        const uploadMsg = `Uploading binary ${dstPath.split(/.*[\/|\\]/)[1]} to ${board.port}\n`;
        dispatch({ type: 'APPEND_STDOUT', stdout: uploadMsg });
        console.log(uploadMsg);

        const command = Command.sidecar(
            '../resources/arduino-cli/arduino-cli',
            ['upload', '-v', '-i', dstPath, '-b', board.fqbn, '-p', board.port]
        );

        let output;
        try {
            output = await command.execute();
            dispatch({
                type: 'UPLOAD_COMPLETE',
                stdout: output.stdout,
                code: output.code,
            });
        } catch (error) {
            dispatch({ type: 'GENERIC_ERROR', error });
        } finally {
            // setStdout(output.stdout)
            // setUploadButtonEnabled(true)
            // setUploading(false)
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
                        Myra Robot installer
                    </p>

                    <p className="text-center my-2 text-lg font-bold text-white select-none">
                        Install the software you need to interact with Scratch
                        via Bluetooth (BLE) on your Arduino
                    </p>
                    <p className="text-center my-2 text-base text-white select-none">
                        Check out{' '}
                        <a
                            className="underline"
                            href="https://labs.arduino.cc/en/labs/include-robot"
                            target="_blank"
                        >
                            our documentation
                        </a>
                    </p>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            upload();
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

                        <div className="flex flex-row items-start gap-4 mt-4">
                            <div className="w-1/3 text-right">
                                <label className="select-none w-full text-base font-semibold text-gray-300">
                                    Available boards
                                    <span className="ml-2 text-red-600">*</span>
                                </label>
                            </div>
                            <div className="md:w-2/3 pt-[0.3rem]">
                                <fieldset>
                                    {state.boards.length ? (
                                        state.boards.map((x, index) => (
                                            <div
                                                className="flex items-center mb-4"
                                                key={index}
                                            >
                                                <input
                                                    value={x.name}
                                                    onChange={selectBoard}
                                                    id={`board - option - ${index} `}
                                                    type="radio"
                                                    name="countries"
                                                    className="h-4 w-5 border-gray-300 focus:ring-2 focus:ring-blue-300 mr-2"
                                                    aria-labelledby={`board - option - ${index} `}
                                                    aria-describedby={`board - option - ${index} `}
                                                />
                                                <label
                                                    htmlFor={`board - option - ${index} `}
                                                    className="select-none w-full text-base font-semibold leading-none text-gray-300"
                                                >
                                                    {x.name}
                                                </label>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="italic select-none w-full leading-none text-gray-600">
                                            No boards found
                                        </div>
                                    )}
                                </fieldset>
                            </div>
                        </div>
                        <div className="flex flex-row items-start gap-4">
                            <div className="w-1/3 text-right"></div>
                            <div className="md:w-2/3 pt-1">
                                <button
                                    disabled={!state.uploadButtonEnabled}
                                    className="flex justify-center min-w-[200px] mt-4 font-semibold leading-none text-white py-4 px-10 bg-blue-700 rounded hover:bg-blue-600 focus:ring-2 focus:ring-offset-2 focus:ring-blue-700 focus:outline-none
                disabled:bg-sky-900 disabled:text-slate-500 disabled:border-blue-300 disabled:shadow-none"
                                >
                                    {state.uploading ? (
                                        <>
                                            <svg
                                                class="inline-block animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle
                                                    class="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    stroke-width="4"
                                                ></circle>
                                                <path
                                                    class="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                ></path>
                                            </svg>
                                            Uploading...
                                        </>
                                    ) : (
                                        'Upload'
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                    {state.error && (
                        <p class="text-red-600 container mx-auto">
                            {state.error?.message}
                        </p>
                    )}
                    <textarea
                        rows={4}
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

const FormField = ({ type = 'text', value, name, onChange }) => {
    return (
        <input
            type={type}
            value={value}
            name={name}
            onChange={onChange}
            className="leading-none text-gray-50 p-3 focus:outline  focus:outline-1 focus:outline-blue- mt-4 border-0 bg-gray-800 rounded"
        />
    );
};

const FormControl = ({
    type = 'text',
    value,
    name,
    label,
    tooltip,
    onChange,
}) => {
    return (
        <div className="flex flex-row items-center gap-4">
            <div className="w-1/3 text-right mt-4">
                <label className="select-none w-full text-base font-semibold leading-none text-gray-300">
                    {label || capitalize(name)}
                </label>
            </div>
            <div className="md:w-2/3 flex flex-row">
                <FormField
                    type={type}
                    value={value}
                    name={name}
                    onChange={onChange}
                />
                {tooltip && (
                    <>
                        <Tooltip
                            id="my-tooltip"
                            style={{
                                backgroundColor:
                                    'rgb(37 99 235 / var(--tw-bg-opacity))',
                                color: '#fff',
                                maxWidth: '480px',
                            }}
                        />
                        <svg
                            className="h-5 w-5 mt-6 ml-2"
                            viewBox="0 0 160 160"
                            data-tooltip-id="my-tooltip"
                            data-tooltip-content={tooltip}
                            data-tooltip-place="top"
                        >
                            <g fill="white">
                                <path d="m80 15c-35.88 0-65 29.12-65 65s29.12 65 65 65 65-29.12 65-65-29.12-65-65-65zm0 10c30.36 0 55 24.64 55 55s-24.64 55-55 55-55-24.64-55-55 24.64-55 55-55z" />
                                <path
                                    d="m57.373 18.231a9.3834 9.1153 0 1 1 -18.767 0 9.3834 9.1153 0 1 1 18.767 0z"
                                    transform="matrix(1.1989 0 0 1.2342 21.214 28.75)"
                                />
                                <path d="m90.665 110.96c-0.069 2.73 1.211 3.5 4.327 3.82l5.008 0.1v5.12h-39.073v-5.12l5.503-0.1c3.291-0.1 4.082-1.38 4.327-3.82v-30.813c0.035-4.879-6.296-4.113-10.757-3.968v-5.074l30.665-1.105" />
                            </g>
                        </svg>
                    </>
                )}
            </div>
        </div>
    );
};

export default App;

import { Command } from '@tauri-apps/api/shell';

const arduinoCliPath = '../resources/arduino-cli/arduino-cli';

const getVersion = async () => {
    const command = Command.sidecar(arduinoCliPath, [
        'version',
        '--format',
        'json',
    ]);
    const output = await command.execute();
    const versionObject = JSON.parse(output.stdout);
    return `${versionObject.VersionString} - ${versionObject.Date} `;
};

const getBoards = ({
    fqbnList,
    onBoardRetrieved,
    onBoardDisconnected,
    onError,
}) => {
    const command = Command.sidecar(arduinoCliPath, [
        'board',
        'list',
        '--format',
        'json',
    ]);
    command.execute().then((output) => {
        try {
            const boardList = JSON.parse(output.stdout);
            const matchingBoards = boardList
                .filter((row) =>
                    row.matching_boards?.find((o) => fqbnList.includes(o.fqbn))
                )
                .map((board) => ({
                    name: board.matching_boards[0]?.name,
                    fqbn: board.matching_boards[0]?.fqbn,
                    port: board.port?.address,
                }));
            if (matchingBoards.length > 0) {
                onBoardRetrieved(matchingBoards);
            } else {
                onBoardDisconnected();
            }
        } catch (err) {
            onError(err);
        }
    });
};

const upload = ({ dstPath, fqbn, port, onData, onClose, onError }) => {
    const command = Command.sidecar('../resources/arduino-cli/arduino-cli', [
        'upload',
        '-v',
        '-i',
        dstPath,
        '-b',
        fqbn,
        '-p',
        port,
    ]);

    try {
        command.stdout.on('data', onData);
        command.on('close', onClose);
        command.spawn().then((child) => {
            console.log('pid:', child.pid);
        });
    } catch (error) {
        onError(error);
    }
};

export { getVersion, getBoards, upload };

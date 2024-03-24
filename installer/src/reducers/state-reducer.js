import tail from '../utils/tail'

const reducer = (state, action) => {
  switch (action.type) {
    case "UPLOAD_STARTED":
      return {
        ...state,
        uploading: true,
        uploadButtonEnabled: false,
        error: null,
        stdout: '',
        code: null
      }
    case "UPLOAD_COMPLETE":
      return {
        ...state,
        uploading: false,
        uploadButtonEnabled: state.boards?.length > 0 && state.selectedBoard,
        error: null,
        stdout: tail(action.stdout),
        code: action.code
      }
    case "UPLOAD_FAILED":
      return {
        ...state,
        uploading: false,
        uploadButtonEnabled: state.boards?.length > 0 && state.selectedBoard,
        error: action.error,
        stdout: tail(action.stdout),
        code: action.code
      }

    case "GENERIC_ERROR":
      return {
        ...state,
        uploading: false,
        uploadButtonEnabled: state.boards?.length > 0 && state.selectedBoard,
        error: action.error,
      }
    case "BOARDS_RETRIEVED":
      return {
        ...state,
        boards: action.boards,
      }
    case "BOARDS_DISCONNECTED":
      return {
        ...state,
        boards: [],
        uploadButtonEnabled: false,
        uploading: false,
        selectedBoard: null,
      }
    case "BOARDS_SELECTED":
      return {
        ...state,
        selectedBoard: action.selectedBoard,
        uploadButtonEnabled: true,
      }
    case "APPEND_STDOUT":
      return {
        ...state,
        stdout: tail(`${state.stdout}\n${action.stdout}`)
      }

    default:
      return state;
  }
};

export default reducer;
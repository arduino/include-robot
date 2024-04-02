function LoadingButton({ enabled, loading }) {
    return (
        <button
            type="submit"
            disabled={!enabled}
            className="flex justify-center min-w-[200px] mt-4 font-semibold leading-none text-white py-4 px-10 bg-blue-700 rounded hover:bg-blue-600 focus:ring-2 focus:ring-offset-2 focus:ring-blue-700 focus:outline-none                 disabled:bg-sky-900 disabled:text-slate-500 disabled:border-blue-300 disabled:shadow-none"
        >
            {loading ? (
                <>
                    <svg
                        className="inline-block animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                    Uploading...
                </>
            ) : (
                'Upload'
            )}
        </button>
    );
}

export default LoadingButton;

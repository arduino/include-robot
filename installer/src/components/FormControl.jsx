import { Tooltip } from 'react-tooltip';
import capitalize from '../utils/capitalize';

/**
 * A simple form input field with label and surrounding divs, optionally a tooltip message
 *
 * @param {object} { type = 'text', value, name, label, tooltip, onChange }
 * @return {ReactNode} A form input field with label and surrounding divs
 */
function FormControl({ type = 'text', value, name, label, tooltip, onChange }) {
    return (
        <div className="flex flex-row items-center gap-4">
            <div className="w-1/3 text-right mt-4">
                <label
                    htmlFor={name}
                    className="select-none w-full text-base font-semibold leading-none text-gray-300"
                >
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
}

/**
 * Simple single-value form field.
 *
 * TODO: implement radio group, which can be used to display the list of available boards
 *
 * @param {*} { type = 'text', value, name, onChange }
 * @return {ReactNode} A React element which represents a simple input text
 *                    (or other types, like "number", etc ) field
 */
function FormField({ type = 'text', value, name, onChange }) {
    return (
        <input
            autoComplete="false"
            type={type}
            value={value}
            name={name}
            onChange={onChange}
            className="leading-none text-gray-50 p-3 focus:outline  focus:outline-1 focus:outline-blue- mt-4 border-0 bg-gray-800 rounded"
        />
    );
}

export default FormControl;

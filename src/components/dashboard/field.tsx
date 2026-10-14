import Input from "@ui/form-elements/input";

type Props = {
    label: string;
    name: string;
    type?: string;
    required?: boolean;
    autoComplete?: string;
    defaultValue?: string;
    placeholder?: string;
    hint?: string;
    error?: string;
    inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
};

/** Label + the site's existing Input, with hint and error text. */
export default function Field({ label, name, hint, error, ...rest }: Props) {
    const id = `f-${name}`;
    return (
        <div className="tw-mb-5">
            <label htmlFor={id} className="tw-block tw-text-md tw-font-medium tw-text-heading tw-mb-2">
                {label}
                {rest.required && <span className="tw-text-danger" aria-hidden> *</span>}
            </label>
            <Input
                id={id}
                name={name}
                state={error ? "error" : undefined}
                feedbackText={error}
                aria-describedby={hint ? `${id}-hint` : undefined}
                {...rest}
            />
            {hint && !error && (
                <p id={`${id}-hint`} className="tw-text-sm tw-mt-1.5 tw-text-gray-300">
                    {hint}
                </p>
            )}
        </div>
    );
}

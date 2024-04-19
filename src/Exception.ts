/**
 * This class is a special implementation of JavaScript's Error class. It is
 * containing additional functionality for handling outputs like stacktrace. 
 */
export class Exception extends Error {

    /**
     * Constructor for the ErrorCodeException.
     * 
     * @param errorCode is the error/status code which is assigned to the exception.
     * @param message is the detailed message of the exception.
     * @param cause is an optional cause which is the actual reason for this exception.
     */
    constructor(
        message: string,
        readonly cause?: Error
    ) {
        super(message);
        Error.captureStackTrace(this, this.constructor);
        this.name = "NoVa-Exception"
        this.cause = cause;
    }

    /**
     * This method attaches the causes of an exception recursively to the given
     * trace string.
     * 
     * @param trace is the string to attach the cause to.
     * @param cause is the cause to be added.
     * @returns A string is returned with the causes added to the string.
     */
    private attachCause(trace: string, cause: unknown | undefined): string {
        if (cause && cause instanceof Exception) {
            trace += `Caused by ${cause.name}: "${cause.message ? cause.message : "<no message>"}"\n`;
            trace += cause.stack ? cause.stack : "<no stacktrace>";
            trace += "\n";
            return this.attachCause(trace, cause.cause);
        } else {
            return trace;
        }
    }

    /**
     * This method returns the stacktrace of this exception incl. all causes.
     */
    public printStacktrace() {
        let trace = "Error:\n";
        trace += this.stack ? this.stack : "<no stacktrace>";
        trace += "\n";
        console.log(this.attachCause(trace, this.cause));
    }


    /**
     * This method returns the stacktrace of this exception incl. all causes.
     */
    public toString() {
        let trace = "Error:\n";
        trace += this.stack ? this.stack : "<no stacktrace>";
        trace += "\n";
        return this.attachCause(trace, this.cause);
    }
}
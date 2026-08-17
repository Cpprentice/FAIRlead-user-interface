import { FetchError } from "schema_api";
import { ref } from "vue";


interface Message {
    text: string
    color: string
    
}

interface PromiseMessage {
    text: string
    promise: Promise<any>
    success: (val: unknown) => Message | null
    error: (val: Error) => Message | null
}


type MessageUnion = Message | PromiseMessage


const messages = ref<MessageUnion[]>([]);

export function useNotifications() {
    
    function addError(text: string) {
        messages.value.push({
            text: text,
            color: "error"
        })
    }

    function addInfo(text: string) {
        messages.value.push({
            text: text,
            color: "info"
        })
    }

    function addSuccess(text: string) {
        messages.value.push({
            text: text,
            color: 'success'
        })
    }


    function onResolve(arg: unknown) {
        console.log('resolve', arg)
        return null;
        return {
            text: 'Promise resolved',
            color: 'success'
        }
    }

    function onReject(error: Error) {
        const message = error instanceof FetchError ? error.message : String(error);
        return {
            text: message,
            color: 'error'
        }
    }

    function addPromise<T>(text: string, promise: Promise<T>) {
        messages.value.push({
            text: text,
            promise: promise,
            success: onResolve,
            error: onReject
        })
    }

    function trackPromise<T>(text: string, promise: Promise<T>): Promise<T> {
        addPromise(text, promise)
        return promise
    }

    return {messages, addError, addInfo, addSuccess, addPromise, trackPromise}

}

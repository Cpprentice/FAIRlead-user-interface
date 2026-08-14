import { ref } from "vue";


interface Message {
    text: string
    color: string
    
}

interface PromiseMessage {
    text: string
    promise: Promise<any>
    success: () => Message
    error: () => Message
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


    function onResolve() {
        return {
            text: 'Promise resolved',
            color: 'success'
        }
    }

    function onReject() {
        return {
            text: 'Promise rejected',
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

    return {messages, addError, addInfo, addSuccess, addPromise}

}

import { reactive } from "vue";

interface ReteSettings
{
    showAttributes?: boolean;
}

const reteSettings = reactive({
    showAttributes: true
} as ReteSettings);

export {reteSettings}

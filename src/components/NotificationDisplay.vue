<template>
    <v-snackbar-queue
        v-model="messages"
        :total-visible="3"
        :closable="true"
        :timeout="4000">
    </v-snackbar-queue>
</template>

<script lang="ts" setup>
import { useNotifications } from '@/providers/notifications';
import { onMounted } from 'vue';


const { messages, addInfo } = useNotifications();

onMounted(() => {
    addInfo('Welcome to the info system')
})

</script>
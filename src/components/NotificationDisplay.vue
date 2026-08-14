<template>
    <v-snackbar-queue
        v-model="messages"
        
        :closable="true"
        :timeout="4000">
    </v-snackbar-queue>
    <!--:total-visible="3" starts to be supported in vuetify 4.0-->
</template>

<script lang="ts" setup>
import { useNotifications } from '@/providers/notifications';
import { onMounted } from 'vue';


const { messages, addInfo } = useNotifications();

onMounted(() => {
    addInfo('Welcome to the info system')
})

</script>
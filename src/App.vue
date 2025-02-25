<script lang="ts" setup>
import Toolbar from './components/Toolbar.vue';
import { RouterView } from 'vue-router';
</script>

<template>
  <v-app>
    <Toolbar></Toolbar>
    <RouterView></RouterView>
  </v-app>
</template>

<style scoped>
</style>

<template>
    <div class="hello">
        <h3>{{ msg }}</h3>
    </div>
</template>

<script>
    export default {
        name: 'App',
        data() {
            return {
                msg: 'Hello Mondo.'
            }
        },
    }
</script>

<style>
    h3 {
        color: red;
    }
</style>
<template>
    <div id="home">
        <div class="container">
            <router-link class="container-item"
                         to="/enties"
            >enties方法
            </router-link>
            <router-link class="container-item"
                         to="/clone"
            >clone方法
            </router-link>
            <router-link class="container-item"
                         to="/instance"
            >instance方法
            </router-link>
        </div>
    </div>
</template>
<script>


    export default {
        name: "home",
        data() {
            return {}
        },
        beforeDestroy() {

        },
        mounted() {


        },
        methods: {}
    };
</script>
<style scoped>
    #home {
        display: flex;
        justify-content: center; /* 水平居中 */
        margin-top: 100px;
    }

    .container {
        display: flex;
        justify-content: center; /* 水平居中 */
    }

    .container-item {
        color: #fff;
        background-color: #409eff;
        border-color: #409eff;
        white-space: nowrap;
        cursor: pointer;
        -webkit-appearance: none;
        text-align: center;
        box-sizing: border-box;
        outline: none;
        margin: 0;
        transition: .1s;
        font-weight: 500;
        -moz-user-select: none;
        -webkit-user-select: none;
        -ms-user-select: none;
        padding: 12px 20px;
        font-size: 14px;
        border-radius: 4px;
        margin-left: 10px;
        text-decoration: none;
    }
</style>

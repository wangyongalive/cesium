import Vue from 'vue'
import Router from 'vue-router'


Vue.use(Router);

export default new Router({
    routes: [
        {
            path: '/',
            name: 'home',
            component: () => import(/* webpackChunkName: "cesium" */ './views/instance.vue')
        },
        // {
        //     path: '/clone',
        //     name: 'clone',
        //     component: () => import(/* webpackChunkName: "cesium" */ './views/clone.vue')
        // },
        // {
        //     path: '/instance',
        //     name: 'instance',
        //     component: () => import(/* webpackChunkName: "cesium" */ './views/instance.vue')
        // },
        // {
        //     path: '/enties',
        //     name: 'enties',
        //     component: () => import(/* webpackChunkName: "cesium" */ './views/enties.vue')
        // }
    ]
})

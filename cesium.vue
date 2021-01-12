<template>
    <div id="cesiumContainer">
        <div id="toolbar"></div>
    </div>
</template>
<script>
    import {modelData} from "../data";

    export default {
        name: "cesium",
        data() {
            return {
                containers: modelData,
                clockRange: {
                    'LOOP_STOP': Cesium.ClockRange.LOOP_STOP,//到达点后循环执行
                    'CLAMPED': Cesium.ClockRange.CLAMPED,//到达点不再进一步前进
                    'UNBOUNDED': Cesium.ClockRange.UNBOUNDED//到达点后，向后移动
                }
            }
        },
        beforeDestroy() {
            this.viewer = null;
            this.modelObj = null;
            this.modelClone = null;
        },
        mounted() {
            let self = this;
            this.modelObj = {};
            this.modelClone = {};
            this.initCesium();
            this.cloneModel();
            // 给每个模型编号
            modelData.forEach((item, index) => {
                item.label += index;
            });
            self.plane();

            /*用promise方式加载模型 开始*/
            let pro = [];
            for (let container of this.containers) {
                pro.push(this.addContainer(container));
            }
            Promise.all(pro).then((ok) => {
                // self.viewer.flyTo(ok[0], {
                //     offset: new Cesium.HeadingPitchRange(0, Math.PI / 3, 100)
                // }).then(res => {
                //     console.log("1111");
                // });

                // console.log(ok);

                // HeadingPitchRange
                self.viewer.zoomTo(ok[0], new Cesium.HeadingPitchRange(0.0, -0.5, 100)).otherwise(function (error) {
                    //若没有加载成功，提示错误
                    console.log(error);
                });

            });
            pro = null; /*手动置空*/
            /*用promise方式加载模型 结束*/

        }
        ,
        methods: {
            cloneModel() {
                // 获取待克隆的对象
                for (let i = 0; i < modelData.length; i++) {
                    if (!this.modelObj[modelData[i].value]) {
                        this.modelObj[modelData[i].value] = modelData[i];
                        this.modelClone[modelData[i].value] = this.clone(modelData[i]);// 克隆对象
                    }
                }
            },
            clone(option) {
                let self = this;
                // heading 偏航角
                // pitch 俯仰角
                // roll 滚转角
                let {label, scale, url, longitude, latitude, height, heading, pitch, roll} = option;

                let position = Cesium.Cartesian3.fromDegrees(
                    longitude,
                    latitude,
                    height
                );

                let hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
                let orientation = Cesium.Transforms.headingPitchRollQuaternion(
                    position,
                    hpr
                );

                let entity = self.viewer.entities.add({
                    name: label,
                    position: position,
                    orientation: orientation,
                    model: {
                        uri: url,
                        scale
                    },
                });

                return entity.model;
            },
            addContainer(option) {
                let self = this;
                return new Promise((resolve, reject) => {
                    let {value, label, longitude, latitude, height, desc, heading, pitch, roll, img} = option;
                    let position = Cesium.Cartesian3.fromDegrees(
                        longitude,
                        latitude,
                        height
                    );
                    let hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
                    let orientation = Cesium.Transforms.headingPitchRollQuaternion(
                        position,
                        hpr
                    );

                    let entity = self.viewer.entities.add({
                        name: label,   // InfoBox的标题
                        position: position,
                        orientation: orientation,
                        model: self.modelClone[value],
                        // InfoBox描述
                        description: `
                                 <div style="min-height: 200px">
                            <img  width="50%"
                            style="float: left;margin-right: 10px;margin-bottom: 10px"
                            src=${img} />
                            <p>
                              ${desc}
                            </p>
                            </div>
                    `
                    });
                    resolve(entity);
                });


            },
            initCesium() {
                let self = this;
                this.viewer = new Cesium.Viewer("cesiumContainer", {
                    // infoBox: false, // infoBox  // 鼠标左键单击，选中Entity，鼠标左键双击，则会追踪到Entity
                    selectionIndicator: false, // 关闭选择控件
                    // shadows: true,
                    shouldAnimate: true,
                    requestRenderMode: true, //  在页面不变化时，暂停渲染
                    animation: false,  // 关闭时间轴动画
                    timeline: false,   // 关闭时间轴
                    fullscreenButton: false,
                    geocoder: false,
                    baseLayerPicker: false,
                    homeButton: false,
                    sceneModePicker: false,
                    navigationHelpButton: false,
                    vrButton: false,
                    // 加载谷歌卫星影像
                    imageryProvider: new Cesium.UrlTemplateImageryProvider({
                        url: "http://mt1.google.cn/vt/lyrs=s&hl=zh-CN&x={x}&y={y}&z={z}&s=Gali"
                    }),
                    // terrainProvider: Cesium.createWorldTerrain()
                });
                // this.viewer.scene.globe.enableLighting = true;
                this.viewer.shadow = true;
                this.viewer.scene.highDynamicRange = false;
                // 隐藏Cesium的logo
                this.viewer.cesiumWidget.creditContainer.style.display = "none";

                this.viewer.scene.debugShowFramesPerSecond = true;
                this.viewer.scene.moon.show = false;
                this.viewer.scene.fog.enabled = false;
                this.viewer.scene.sun.show = false;
                this.viewer.scene.skyBox.show = false;

                this.viewer.resolutionScale = 0.9;//默认值为1.0

                /*初始化clock  开始*/
                let gd = self.getDate();
                let clock = self.viewer.clock;
                clock.startTime = gd.start;
                clock.endTime = gd.end;
                clock.currentTime = gd.start;
                clock.clockRange = Cesium.ClockRange.CLAMPED;
                clock.multiplier = 1;
                /*初始化clock  结束*/

                // 抗锯齿
                this.viewer._cesiumWidget._supportsImageRenderingPixelated = Cesium.FeatureDetection.supportsImageRenderingPixelated();
                this.viewer._cesiumWidget._forceResize = true;
                if (Cesium.FeatureDetection.supportsImageRenderingPixelated()) {
                    var vtxf_dpr = window.devicePixelRatio;
                    // 适度降低分辨率
                    while (vtxf_dpr >= 2.0) {
                        vtxf_dpr /= 2.0;
                    }
                    this.viewer.resolutionScale = vtxf_dpr;
                }


                // 标签
                let labelEntity = this.viewer.entities.add({
                    label: {
                        show: false,
                        showBackground: true,
                        font: "14px monospace",
                        horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
                        verticalOrigin: Cesium.VerticalOrigin.TOP,
                        pixelOffset: new Cesium.Cartesian2(15, 0),
                    },
                });


                // 鼠标左键点击事件
                let previousPickedEntity = undefined;
                let handler = new Cesium.ScreenSpaceEventHandler(self.viewer.scene.canvas);
                handler.setInputAction(function (click) {

                    /*获取节点经纬度 开始  MOUSE_MOVE*/
                    // var cartesian = self.viewer.camera.pickEllipsoid(
                    //     movement.endPosition,
                    //     self.viewer.scene.globe.ellipsoid
                    // );
                    // if (cartesian) {
                    //     var cartographic = Cesium.Cartographic.fromCartesian(cartesian);
                    //     var longitudeString = Cesium.Math.toDegrees(
                    //         cartographic.longitude
                    //     ).toFixed(6);
                    //     var latitudeString = Cesium.Math.toDegrees(
                    //         cartographic.latitude
                    //     ).toFixed(6);
                    //
                    //     labelEntity.position = cartesian;
                    //     labelEntity.label.show = true;
                    //     labelEntity.label.text =
                    //         "Lon: " +
                    //         ("   " + longitudeString).slice(-11) +
                    //         "\u00B0" +
                    //         "\nLat: " +
                    //         ("   " + latitudeString).slice(-11) +
                    //         "\u00B0";
                    // } else {
                    //     labelEntity.label.show = false;
                    // }
                    /*获取节点经纬度 结束*/


                    // /**获取点击的物体  开始  LEFT_CLICK**/
                    let pickedEntity = self.viewer.scene.pick(click.position);
                    if (pickedEntity.id.name == "plane") {

                        return;
                    }
                    // 取消上一个高亮对象的高亮效果
                    if (Cesium.defined(previousPickedEntity)) {
                        previousPickedEntity.id.model.color = new Cesium.Color(1.0, 1.0, 1.0, 1.0);
                        previousPickedEntity.id.model.colorBlendMode = Cesium.ColorBlendMode.HIGHLIGHT;
                    }
                    // 当前entity高亮
                    if (Cesium.defined(pickedEntity)) {
                        pickedEntity.id.model.color = new Cesium.Color(1.0, 1.0, 1.0, 0.9);
                        pickedEntity.id.model.colorBlendMode = Cesium.ColorBlendMode.MIX;
                        previousPickedEntity = pickedEntity;
                    }
                    /**获取点击的物体  结束**/

                }, Cesium.ScreenSpaceEventType.LEFT_CLICK);


            },
            //设置开始和结束时间
            getDate(seconds = 10) {
                let d = new Date(2020, 9, 20, 3, 59, 50);
                let t = [d.getFullYear(), d.getMonth(), d.getDate(), d.getHours() + 8, d.getMinutes(), d.getSeconds()]
                let start = Cesium.JulianDate.fromDate(new Date(t[0], t[1], t[2], t[3], t[4], t[5]));
                let stop = Cesium.JulianDate.addSeconds(start, seconds, new Cesium.JulianDate());
                return {
                    start,
                    stop
                }
            },
            plane() {
                // 绘制不规则图形，注意点的顺序
                let plane = this.viewer.entities.add({
                    name: "plane",
                    position: Cesium.Cartesian3.fromDegrees(117.982715, 24.457544),
                    polygon: {
                        hierarchy: Cesium.Cartesian3.fromDegreesArray([
                            117.968782, 24.462700,
                            117.971496, 24.462183,
                            117.971053, 24.460169,
                            117.983064, 24.457385,
                            117.982062, 24.452955,
                            117.984445, 24.452420,
                            117.984310, 24.452050,
                            117.967019, 24.455615
                        ]),
                        material: new Cesium.Color(0.74, 0.74, 0.74),
                        outline: true,
                        outlineColor: Cesium.Color.BLACK,
                        outlineWidth: 10,
                        clampToGround: true //开启贴地
                    },
                });
                // this.viewer.zoomTo(plane);
            },
            createLineAndCar() {
                let self = this;

                // 从CZML中载入无人机轨迹
                var dronePromise = Cesium.CzmlDataSource.load('./static/assets/SampleData/port.czml');
                var drone;
                dronePromise.then(function (dataSource) {
                    self.viewer.dataSources.add(dataSource);
                    drone = dataSource.entities.getById('CesiumMilkTruck');
                    // 基于轨迹的位置点，自动计算朝向
                    drone.orientation = new Cesium.VelocityOrientationProperty(drone.position);
                    drone.viewFrom = new Cesium.Cartesian3(500, 500, 500);
                    self.viewer.trackedEntity = drone; // 跟随
                });

                // 117.968368,24.460791  左上角
                // 117.982715,24.457544  右上角
                // 117.967319,24.455896  左下角
                // 117.981598,24.452734  右下角

            }
        }
    };
</script>
<style scoped>
    #cesiumContainer {
        position: relative;
        height: 100%;
    }

    #toolbar {
        position: absolute;
        z-index: 1000;
    }
</style>

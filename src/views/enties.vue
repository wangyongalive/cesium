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
                },
                maxHeight: 2300  // 设置相机显示的最大高度
            }
        },
        beforeDestroy() {
            this.viewer = null;
        },
        mounted() {
            let self = this;
            this.initCesium();
            // 给每个模型编号
            modelData.forEach((item, index) => {
                item.label += index;
            });
            self.plane();
            self.lookAt(Cesium.Cartesian3.fromDegrees(117.978352, 24.458217), {
                heading: Cesium.Math.toRadians(10.0),
                pitch: Cesium.Math.toRadians(-60.0),
                range: 2500.0
            });
            self.viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY); //取消lookat的视角锁定
            for (let container of this.containers) {
                this.addContainer(container)
            }
        }
        ,
        methods: {
            addContainer(option) {
                let self = this;
                let {value, label, longitude, latitude, height, desc, heading, pitch, roll, img, scale, url} = option;
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

                if (value == 'JZX') {
                    scale = 100*scale;
                }

                self.viewer.entities.add({
                    name: label,   // InfoBox的标题
                    position: position,
                    orientation: orientation,
                    model: {
                        uri: url,
                        scale
                    },
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

                this.viewer.scene.debugShowFramesPerSecond = true;  // 开启FPS
                this.viewer.scene.moon.show = false; // 关闭特效
                this.viewer.scene.fog.enabled = false; // 关闭特效
                this.viewer.scene.sun.show = false; // 关闭特效
                this.viewer.scene.skyBox.show = false; // 关闭特效

                this.viewer.resolutionScale = 0.9; //默认值为1.0

                // 相机显示的最大高度
                this.viewer.scene.screenSpaceCameraController.maximumZoomDistance = this.maxHeight;

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
                    if (!(Cesium.defined(pickedEntity))) {
                        return;
                    }
                    // 拾取到地面就直接返回
                    if (pickedEntity.primitive instanceof Cesium.GroundPrimitive) {
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
            lookAt(center, offset) {
                let {heading, pitch, range} = offset;
                this.viewer.camera.lookAt(center,
                    new Cesium.HeadingPitchRange(heading, pitch, range));
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
                // this.viewer.zoomTo(plane, new Cesium.HeadingPitchRange(0.0, -0.5, 100));
                // this.viewer.flyTo(plane, {
                //     offset: {
                //         heading : Cesium.Math.toRadians(10),
                //         pitch : Cesium.Math.toRadians(-60),
                //         range : 2500
                //     }
                // });
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

<template>
    <div>
        <div id="cesiumContainer"></div>
        <div
                class="tips__wrap"
                v-show="isTipBox"
                v-bind:style="{
                       left: tipBoxPostion.x,
                       top: tipBoxPostion.y,
                    }"
        >
            <div class="tips__box">
                <div class="title">
                    <div class="left">
                        <img
                                src="../../public/static/img/details/tipsCri.png"
                                alt=""
                                class="title__logo"
                        />
                    </div>
                    <div class="right" @click="close">
                        <img
                                src="../../public/static//img/details/closes.png"
                                alt=""
                                class="title__logo"
                        />
                    </div>
                </div>
                <div class="con">
                    <div class="con__item">
                        <ul :class="['item__box']">
                            <li class="item">
                                <span class="item__name">集装箱：</span>
                                <span class="item__cont"></span>
                            </li>
                            <li class="item">
                                <span class="item__name">提单号：</span>
                                <span class="item__cont"></span>
                            </li>
                            <li class="item">
                                <span class="item__name">场位：</span>
                                <span class="item__cont"></span>
                            </li>
                            <li class="item">
                                <span class="item__name">尺寸：</span>
                                <span class="item__cont"></span>
                            </li>
                            <li class="item">
                                <span class="item__name">箱主：</span>
                                <span class="item__cont"></span>
                            </li>
                            <li class="item">
                                <span class="item__name">iOS：</span>
                                <span class="item__cont"></span>
                            </li>
                            <li class="item">
                                <span class="item__name">空重：</span>
                                <span class="item__cont"></span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>

</template>
<script>
    import {modelData, ludengposition} from "../data";
    import points from "../../public/static/points/points";

    export default {
        name: "cesium",
        data() {
            return {
                containers: modelData,  // 每个实例数据
                clockRange: {
                    'LOOP_STOP': Cesium.ClockRange.LOOP_STOP,//到达点后循环执行
                    'CLAMPED': Cesium.ClockRange.CLAMPED,//到达点不再进一步前进
                    'UNBOUNDED': Cesium.ClockRange.UNBOUNDED//到达点后，向后移动
                },
                maxHeight: 2300,  // 设置相机显示的最大高度
                isTipBox: false,
                tipBoxPostion: {x: null, y: null},
            }
        },
        beforeDestroy() {
            this.viewer = null;
            this.modelClone = null;
            this.instances = null;
            this.selectStage = null;
        },
        mounted() {
            let self = this;
            this.modelClone = {};
            this.instances = {};
            this.initCesium();
            // this.plane();
            this.add3dTilesDitu();
            this.addContainerV1(points.result);
            //  相机朝向
            self.lookAt(Cesium.Cartesian3.fromDegrees(117.978352, 24.458217), {
                heading: Cesium.Math.toRadians(10.0),
                pitch: Cesium.Math.toRadians(-60.0),
                range: self.maxHeight
            });
            self.viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY); //取消lookat的视角锁定

            // 给每个模型编号
            modelData.forEach((item, index) => {
                item.label += index;
            });

            // 用instances保存每个类型对象集合
            for (let i = 0; i < modelData.length; i++) {
                if (!this.instances[modelData[i].value]) {
                    this.instances[modelData[i].value] = [];
                }
            }

            // 确定每个instance的位置，朝向，大小等信息
            for (let container of this.containers) {
                this.addModel(container);
            }

            // 利用ModelInstanceCollection加载大量模型
            for (let instance in this.instances) {
                this.viewer.scene.primitives.add(
                    new Cesium.ModelInstanceCollection({
                        url: `./static/model/${instance}/${instance}.glb`,
                        instances: self.instances[instance],
                        allowPicking: true
                    })
                );
            }

            //  添加路灯
            this.addStreetLamp(ludengposition);
            //船
            this.addBoat();
            // 选择物体
            this.selectedBox();
            // 获取经纬度坐标的方法
            // this.getPositionLonLat();
        },
        methods: {
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
                    sceneModePicker: false,  // 是否显示投影方式控件
                    navigationHelpButton: false, // 是否显示帮助信息控件
                    vrButton: false,
                    // 加载谷歌卫星影像
                    imageryProvider: new Cesium.UrlTemplateImageryProvider({
                        url: "http://mt1.google.cn/vt/lyrs=s&hl=zh-CN&x={x}&y={y}&z={z}&s=Gali"
                    }),
                    // terrainProvider: Cesium.createWorldTerrain()
                });
                this.viewer.scene.globe.enableLighting = false;
                this.viewer.shadow = false;
                this.viewer.scene.highDynamicRange = false;
                this.viewer.scene.debugShowFramesPerSecond = true; // 开启帧率

                this.viewer.cesiumWidget.creditContainer.style.display = "none";  // 隐藏Cesium的logo


                // 控制鼠标的交互方式
                // 滚轮缩放，右键旋转
                this.viewer.scene.screenSpaceCameraController.zoomEventTypes = [
                    Cesium.CameraEventType.WHEEL,
                    Cesium.CameraEventType.PINCH,
                ];
                this.viewer.scene.screenSpaceCameraController.tiltEventTypes = [
                    Cesium.CameraEventType.PINCH,
                    Cesium.CameraEventType.RIGHT_DRAG,
                ];


                this.viewer.scene.moon.show = false;
                this.viewer.scene.fog.enabled = false;
                this.viewer.scene.sun.show = false;
                this.viewer.scene.skyBox.show = false;

                this.viewer.resolutionScale = 0.9;//默认值为1.0


                // 相机显示的最大高度
                this.viewer.scene.screenSpaceCameraController.maximumZoomDistance = this.maxHeight;


                /*初始化clock   让光照的亮度最大 开始*/
                let gd = this.getDate();
                let clock = this.viewer.clock;
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


                //开启深度检测  会计算其它地理要素和地形之间的遮蔽关系，地面会消失。
                // Enable depth testing so things behind the terrain disappear.
                this.viewer.scene.globe.depthTestAgainstTerrain = true;
                //开启抗锯齿
                this.viewer.scene.fxaa = true;
                this.viewer.scene.postProcessStages.fxaa.enabled = true;


            },
            getPositionLonLat() {
                let self = this;
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

                // Mouse over the globe to see the cartographic position
                let handler = new Cesium.ScreenSpaceEventHandler(self.viewer.scene.canvas);
                handler.setInputAction(function (movement) {
                    /*获取节点经纬度 开始*/
                    var cartesian = self.viewer.camera.pickEllipsoid(
                        movement.endPosition,
                        self.viewer.scene.globe.ellipsoid
                    );
                    if (cartesian) {
                        var cartographic = Cesium.Cartographic.fromCartesian(cartesian);
                        var longitudeString = Cesium.Math.toDegrees(
                            cartographic.longitude
                        ).toFixed(6);
                        var latitudeString = Cesium.Math.toDegrees(
                            cartographic.latitude
                        ).toFixed(6);

                        labelEntity.position = cartesian;
                        labelEntity.label.show = true;
                        labelEntity.label.text =
                            "Lon: " +
                            ("   " + longitudeString).slice(-11) +
                            "\u00B0" +
                            "\nLat: " +
                            ("   " + latitudeString).slice(-11) +
                            "\u00B0";
                    } else {
                        labelEntity.label.show = false;
                    }
                    /*获取节点经纬度 结束*/
                }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);


                // let handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
                // let previousPickedEntity = undefined;
                // handler.setInputAction(function (click) {
                //         let PickedEntity = self.viewer.scene.pick(click.position);
                //         if (!(Cesium.defined(PickedEntity))) {
                //             return;
                //         }
                //         // 拾取到地面就直接返回
                //         if (PickedEntity.primitive instanceof Cesium.GroundPrimitive) {
                //             return;
                //         }
                //
                //         // 之前拾取的模型
                //         if (previousPickedEntity && previousPickedEntity.primitive instanceof Cesium.ModelInstanceCollection) {
                //             var scaleMatrix = Cesium.Matrix4.fromUniformScale(0.8);
                //             var modelMatrix = Cesium.Matrix4.multiply(
                //                 previousPickedEntity.modelMatrix,
                //                 scaleMatrix,
                //                 new Cesium.Matrix4()
                //             );
                //             previousPickedEntity.modelMatrix = modelMatrix;
                //
                //         }
                //
                //         // 当前拾取的模型
                //         if (PickedEntity && PickedEntity.primitive instanceof Cesium.ModelInstanceCollection) {
                //             var scaleMatrix = Cesium.Matrix4.fromUniformScale(1.25);
                //             var modelMatrix = Cesium.Matrix4.multiply(
                //                 PickedEntity.modelMatrix,
                //                 scaleMatrix,
                //                 new Cesium.Matrix4()
                //             );
                //             PickedEntity.modelMatrix = modelMatrix;
                //             previousPickedEntity = PickedEntity;
                //
                //         }
                //
                //     }
                //     ,
                //     Cesium.ScreenSpaceEventType.LEFT_CLICK
                // );


                // var handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
                // handler.setInputAction(function (movement) {
                //     var position = self.viewer.scene.camera.pickEllipsoid(movement.position, self.viewer.scene.globe.ellipsoid);
                //     // console.log(position);
                // }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

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
                        // outline: true,
                        // outlineColor: Cesium.Color.BLACK,
                        clampToGround: true //开启贴地
                    },
                });

                // this.viewer.flyTo(plane, {
                //     offset: {
                //         heading: Cesium.Math.toRadians(10),
                //         pitch: Cesium.Math.toRadians(-60),
                //         range: 2500
                //     }
                // });


            },
            myrandom(m, n) {
                return Math.floor(Math.random() * (m - n) + n)
            },
            addContainerV1(boxPosition) {
                let instances20 = {};
                let instances40 = {};
                for (let i = 0; i < boxPosition.length; i++) {
                    let position = Cesium.Cartesian3.fromDegrees(
                        boxPosition[i].longitube,
                        boxPosition[i].latiude,
                        2.438 * (boxPosition[i].floor - 1)
                    ); // 定位
                    let modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(
                        position
                    );
                    let m = modelMatrix;
                    //RotateX为旋转角度，转为弧度再参与运算
                    let m1 = Cesium.Matrix3.fromRotationZ(
                        Cesium.Math.toRadians(77)
                    );
                    //矩阵计算
                    Cesium.Matrix4.multiplyByMatrix3(m, m1, m);
                    //赋值
                    modelMatrix = m;

                    if (boxPosition[i].type === 20) {

                        let res = this.myrandom(0, 4);
                        if (instances20[res]) {
                            instances20[res].push({
                                batchId: "box" + i,
                                modelMatrix: modelMatrix,
                            });
                        } else {
                            instances20[res] = [];
                            instances20[res].push({
                                batchId: "box" + i,
                                modelMatrix: modelMatrix,
                            });
                        }

                    } else {

                        let res = this.myrandom(0, 4);
                        if (instances40[res]) {
                            instances40[res].push({
                                batchId: "box" + i,
                                modelMatrix: modelMatrix,
                            });
                        } else {
                            instances40[res] = [];
                            instances40[res].push({
                                batchId: "box" + i,
                                modelMatrix: modelMatrix,
                            });
                        }
                    }
                }

                for (let i = 0; i < Object.keys(instances20).length; i++) {
                    this.viewer.scene.primitives.add(
                        new Cesium.ModelInstanceCollection({
                            url: "../../static/model/BOX20/" + "JZX20" + i + ".gltf",
                            instances: instances20[i],
                            allowPicking: true,
                        })
                    );
                }
                for (let i = 0; i < Object.keys(instances40).length; i++) {
                    this.viewer.scene.primitives.add(
                        new Cesium.ModelInstanceCollection({
                            url: "../../static/model/BOX40/" + "JZX40" + i + ".gltf",
                            instances: instances40[i],
                            allowPicking: true,
                        })
                    );
                }
            },
            addModel(option) {
                // heading 偏航角
                // pitch 俯仰角
                // roll 滚转角
                // 批量加载
                let {value, label, longitude, latitude, height, desc, heading, pitch, roll, img, url, scale} = option;
                let position = Cesium.Cartesian3.fromDegrees(
                    longitude,
                    latitude,
                    height
                );
                let hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
                let orientation = Cesium.Transforms.headingPitchRollToFixedFrame(
                    position,
                    hpr
                );


                Cesium.Matrix4.multiplyByUniformScale(
                    orientation,
                    scale,
                    orientation
                );

                this.instances[value].push({
                    modelMatrix: orientation,
                    batchId: label,
                });

            },
            add3dTilesDitu() {
                let self = this;
                //加载gltf格式数据到cesium
                // let longitude = 117.9751918684395;
                let longitude = 117.9752998684395;
                // let latitude = 24.457690451276;
                let latitude = 24.45775520249;
                let height = -2;
                let tileset = new Cesium.Cesium3DTileset({
                    url: "./static/model/DiTu/tilesetPlane.json",
                });

                tileset.readyPromise
                    .then(function (tileset) {
                        self.viewer.scene.primitives.add(tileset);
                        // 平移
                        let modelMatrix = Cesium.Matrix4.multiplyByTranslation(
                            // 2.1从以度为单位的经度和纬度值返回Cartesian3位置
                            // 2.2计算4x4变换矩阵
                            Cesium.Transforms.eastNorthUpToFixedFrame(
                                Cesium.Cartesian3.fromDegrees(longitude, latitude, height)
                            ),
                            new Cesium.Cartesian3(),
                            new Cesium.Matrix4()
                        );
                        tileset._root.transform = modelMatrix;

                        // 旋转
                        // var m = palaceTileset.modelMatrix;
                        // RotateX为旋转角度，转为弧度再参与运算
                        var m1 = Cesium.Matrix3.fromRotationZ(
                            // Cesium.Math.toRadians(-0.5)
                            Cesium.Math.toRadians(-0.1)
                            // Cesium.Math.toRadians(60)
                        );
                        //矩阵计算
                        Cesium.Matrix4.multiplyByMatrix3(modelMatrix, m1, modelMatrix);
                        // 赋值
                        // tileset.modelMatrix = m1;

                    })
                    .otherwise(function (error) {
                        console.log(error);
                    });
            },
            selectedBox() {
                let self = this;
                let fragmentShaderSource =
                    "uniform sampler2D colorTexture;\n" +
                    "varying vec2 v_textureCoordinates;\n" +
                    "uniform vec4 highlight;\n" +
                    "void main() {\n" +
                    "    vec4 color = texture2D(colorTexture, v_textureCoordinates);\n" +
                    "    if (czm_selected()) {\n" +
                    "        vec3 highlighted = highlight.a * highlight.rgb + (1.0 - highlight.a) * color.rgb;\n" +
                    "        gl_FragColor = vec4(highlighted, 1.0);\n" +
                    "    } else { \n" +
                    "        gl_FragColor = color;\n" +
                    "    }\n" +
                    "}\n";
                // 后期处理
                this.selectStage = this.viewer.scene.postProcessStages.add(
                    new Cesium.PostProcessStage({
                        fragmentShader: fragmentShaderSource,
                        uniforms: {
                            highlight: () => {
                                return new Cesium.Color(0, 0, 255, 0.5);
                            },
                        },
                    })
                );
                this.selectStage.selected = []; // 被选中的物体
                this.listenersClickEvent();
            },
            listenersClickEvent() {
                let handler = new Cesium.ScreenSpaceEventHandler(
                    this.viewer.scene.canvas
                );
                handler.setInputAction((movement) => {
                    // let position = this.viewer.scene.camera.pickEllipsoid(
                    //     movement.position,
                    //     this.viewer.scene.globe.ellipsoid
                    // );
                    // let ellipsoid = this.viewer.scene.globe.ellipsoid;
                    // let cartographic = ellipsoid.cartesianToCartographic(position);
                    // console.log(cartographic.longitude);
                    // let longitude = Cesium.Math.toDegrees(cartographic.longitude); //
                    // let latitude = Cesium.Math.toDegrees(cartographic.latitude);
                    // console.log(longitude, latitude);
                    let pick = this.viewer.scene.pickPosition(movement.position); // 获取拾取的坐标位置
                    let pickModel = this.viewer.scene.pick(movement.position); // 获取拾取的模型

                    // this.getCameraInfo(movement);

                    if (pickModel && pick && (pickModel.id || pickModel._instanceId)) {
                        this.selectStage.selected = [pickModel.primitive];   //

                        // console.log(pickModel);
                        // let height = Cesium.Cartographic.fromCartesian(pick).height;
                        // let lat = Cesium.Math.toDegrees(
                        //     Cesium.Cartographic.fromCartesian(pick).latitude
                        // );
                        // let lng = Cesium.Math.toDegrees(
                        //     Cesium.Cartographic.fromCartesian(pick).longitude
                        // );
                        // let cartesian = Cesium.Cartesian3.fromDegrees(lng, lat, height);
                        // console.log("模型高度点", lng, lat, height);
                        // console.log(cartesian);
                        // console.log(pickModel);

                        if (pickModel._instanceId) {
                            if (pickModel._instanceId.match(RegExp(/box/))) {
                                // 屏幕坐标转换
                                let _pm_position = Cesium.SceneTransforms.wgs84ToWindowCoordinates(
                                    this.viewer.scene,
                                    pick
                                );
                                this.tipBoxPostion = {
                                    x: _pm_position.x + 43 + "px",
                                    y: _pm_position.y - 427 + "px",
                                };
                                this.isTipBox = true;
                                //每帧渲染结束监听
                                this.viewer.scene.camera.moveEnd.addEventListener(() => {
                                    let _pm_position2 = Cesium.SceneTransforms.wgs84ToWindowCoordinates(
                                        this.viewer.scene,
                                        pick
                                    );
                                    this.tipBoxPostion = {
                                        x: _pm_position2.x + 43 + "px",
                                        y: _pm_position2.y - 427 + "px",
                                    };
                                });

                            } else if (pickModel._instanceId.match(RegExp(/ludeng/))) {
                                // this.$eventBus.$emit("shipShowing", 1);
                            }
                        } else {
                            if (typeof pickModel.id === "string") {
                                // if (pickModel.id.match(RegExp(/chuan/))) {
                                //     this.$eventBus.$emit("adding", 3);
                                // } else if (pickModel.id.match(RegExp(/che/))) {
                                //     this.$eventBus.$emit("adding", 1);
                                // }
                            } else {
                                // if (pickModel.id._id.match(RegExp(/qiaodiao/))) {
                                //     this.$eventBus.$emit("adding", 0);
                                // } else if (pickModel.id._id.match(RegExp(/longdiao/))) {
                                //     this.$eventBus.$emit("adding", 2);
                                // }
                            }
                        }

                    } else {
                        this.selectStage.selected = [];
                    }

                }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
            },
            close() {
                this.isTipBox = false;
            },
            addStreetLamp(ludengposition) {
                let instances = [];
                for (let i = 0; i < ludengposition.length; i++) {
                    let position = Cesium.Cartesian3.fromDegrees(
                        ludengposition[i].longitube,
                        ludengposition[i].latiude,
                        0
                    ); // 定位
                    let modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(
                        position
                    );
                    instances.push({
                        batchId: "ludeng" + i,
                        modelMatrix: modelMatrix,
                    });
                }
                this.viewer.scene.primitives.add(
                    new Cesium.ModelInstanceCollection({
                        url: "./static/model/LuDeng/LuDeng.glb",
                        instances: instances,
                        allowPicking: true,
                    })
                );
            },
            addBoat() {
                let modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(
                    Cesium.Cartesian3.fromDegrees(
                        117.97014979294798,
                        24.45463175893613,
                        15.5
                    )
                );
                this.viewer.scene.primitives.add(
                    Cesium.Model.fromGltf({
                        id: "chuan",
                        url: "./static/model/Boat/Boat.glb", //如果为bgltf则为.bgltf
                        modelMatrix: modelMatrix,
                    })
                );
            }
        }
    }
    ;
</script>
<style scoped lang="less">
    #cesiumContainer {
        position: relative;
        height: 100%;
    }

    .tips__wrap {
        display: flex;
        position: absolute;
        background: rgba(0, 0, 0, 0.7);
        left: 200px;
        width: 395px;
        color: #dbdcde;
        z-index: 101;
        cursor: pointer;
        padding: 30px;
        border: 1px solid;
        border-image: linear-gradient(0deg, #5ecbec 0%, #2972f8 100%) 1 1;
        box-shadow: 0px 0px 38px 0px rgba(26, 150, 255, 0.49) inset;

        &:before {
            position: absolute;
            content: "";
            width: 43px;
            height: 49px;
            left: -43px;
            bottom: -47px;
            background: url("../../public/static/img/details/diquan.png") no-repeat;
        }

        .tips__box {
            width: 100%;
            position: relative;

            .logo {
                position: absolute;
                right: 0;
                bottom: 0;
            }
        }

        .title {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 20px;
            position: relative;

            &::after {
                display: inline-block;
                position: absolute;
                content: "";
                bottom: 0px;
                left: 50%;
                transform: translateX(-50%);
                width: 333px;
                height: 6px;
                background-size: 100% 100%;
            }

            .left {
                display: flex;
                align-items: center;
            }

            .right {
                display: flex;
                align-items: center;
            }
        }

        .title__w {
            font-size: 20px;
            font-weight: 700;
            color: #dbdcde;
        }

        .title__logo:nth-of-type(1) {
            margin-right: 11px;
        }

        .con {
            display: flex;
            flex-direction: column;

            .item__title {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .sub {
                font-size: 16px;
                font-weight: 600;
                color: #dbdcde;
            }

            .sub__img {
                width: 14px;
                height: 9px;
                transition: all 0.3s ease-in-out;

                &.active {
                    transform: rotateZ(180deg);
                }
            }

            .con__item {
                position: relative;
            }

            .item__box {
                list-style: none;
                color: #dbdcde;
                position: relative;
                display: flex;
                flex-direction: column;
                transition: all 0.8s ease-in-out;
                overflow: hidden;

                &.zoomOut {
                    display: none;
                }

                .item {
                    margin: 10px;
                    font-size: 14px;

                    .item__name {
                        margin-right: 45px;
                        display: inline-block;
                        min-width: 70px;
                        text-align: left;
                    }
                }
            }
        }
    }
</style>

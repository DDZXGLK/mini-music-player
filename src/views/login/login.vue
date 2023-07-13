<template>
    <div id="login" class="div-flex-center">
        <div class="login-re">
            <div class="left-in">
                <div class="outer">
                    <div class="out" v-for="(it, i) in outList" :key="i">
                        <a :href="it.url" target="_blank" rel="noopener noreferrer">
                            {{ it.name }}
                        </a>
                    </div>
                </div>
            </div>
            <div class="right-in">
                <div class="content div-flex-column-center" element-loading-background="rgba(255, 255, 255, 0.3)">
                    <div class="title div-flex-center">
                        <img src="../assets/img/sgslogo.png" alt="">
                    </div>
                    <div class="hyndl">欢迎您登录</div>
                    <div class="line div-flex-center">
                        <!-- <div class="line-span">用户名:</div> -->
                        <div class="line-value div-flex-center">
                            <el-input v-if="flag == '0'" v-model="user" placeholder="请输入登录账号" prefix-icon="el-icon-user"
                                clearable></el-input>
                        </div>
                    </div>
                    <div class="line div-flex-center">
                        <!-- <div class="line-span">密码:</div> -->
                        <div class="line-value div-flex-center">
                            <el-input v-if="flag == '0'" v-model="password" placeholder="请输入登录密码" prefix-icon="el-icon-lock"
                                show-password clearable @keyup.enter.native="login"></el-input>
                        </div>
                        <div :class="{
                            'line-but': true,
                            'div-flex-center': true,
                            'line-but-disable': isDisable,
                        }" v-if="flag == '1'" @click="getVerification">
                            {{ butTip }}
                        </div>
                    </div>

                    <Vcode @success="success" @close="close" :show="isShow" />
                    <div class="line-login div-flex-center" @click="login">登录</div>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
import Vcode from "vue-puzzle-vcode";
// import { encrypt, decrypt } from "../utils/AesUtils";

export default {
    components: {
        Vcode,
    },
    data() {
        return {
            isShow: false,
            outList: [
                {
                    name: '功能介绍',
                    url: "http://www.ah-cz.cn/"
                }, {
                    name: '通知公告',
                    url: "http://www.ah-cz.cn/"
                }, {
                    name: '了解产品',
                    url: "http://www.ah-cz.cn/"
                }
            ],
            flag: "0", // 登录方式 0 (账号)身份证+密码  1 手机号+验证码
            // user: "", // 账号
            // password: "", // 密码
            // phone: "", // 手机号
            // verification: "", // 验证码
            // loading: false,
            // isDisable: false,
            // butTip: "获取验证码",
            // timer: null,
            // countdown: 60,
            // noticeList: [],
            // index: 0,

        };
    },
    methods: {
        submit() {
            this.isShow = true;
        },
        // 用户通过了验证
        success(msg) {
            this.isShow = false; // 通过验证后，需要手动隐藏模态框
            this.$request(
                "post",
                "/user/login",
                {
                    username: this.user,
                    password: this.password,
                },
                (data) => {
                    this.$message({
                        message: "登录成功!",
                        type: "success",
                    });
                    localStorage.setItem("userId", data.result.userId);
                    localStorage.setItem("token", data.result.token);
                    localStorage.setItem("userName", data.result.userName);
                    localStorage.setItem("name", data.result.userName);
                }
            );
        },
        // 用户点击遮罩层，应该关闭模态框
        close() {
            this.isShow = false;
        },

        /**
         * 登录
         */
        login() {
            this.isShow = true;
        },
    },
    mounted() {
        localStorage.removeItem("userId");
        localStorage.removeItem("userName");

    },
};
</script>


<style lang="less" scoped>
#login {
    width: 100%;
    height: 100%;
    // background-image: url("../assets/img/we01.png");
    background-size: 100% 100%;
    background-repeat: no-repeat;
    position: relative;
    display: flex;
    justify-content: flex-end;

    .login-re {
        width: 36%;
        height: 100%;
        display: flex;


        .left-in {
            width: 15%;
            height: 100%;
            background-color: #dce1ee;

            .outer {
                width: 100%;
                margin-top: 12vh;

                .out {

                    width: 100%;
                    height: 50px;
                    color: #666;
                    font-size: 16px;

                    padding-left: 15px;

                    >a {
                        text-decoration: none;
                        color: #666;
                    }

                    &:hover {
                        cursor: pointer;
                        text-decoration: underline;
                    }
                }
            }
        }

        .right-in {
            width: 85%;
            height: 100%;
            background-color: #fff;
            display: flex;
            flex-direction: column;
            justify-content: space-between;


            .content {
                width: 100%;
                // height: 68%;
                background-color: #ffffff4f;
                // border-radius: 20px;
                // box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12), 0 0 6px rgba(0, 0, 0, 0.08);
                margin-top: 11vh;
                position: relative;

                .hyndl {
                    width: 60%;
                    line-height: 38px;
                    text-align: left;
                    color: #666;
                    font-size: 16px;

                }

                .title {
                    width: 60%;
                    height: 18%;
                    border-bottom: 3px solid #fdfdfd6b;

                    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.308), 0 0 6px rgba(0, 0, 0, 0.192);
                    letter-spacing: 20px;
                    font-weight: bolder;
                    color: #fff;
                    // margin-bottom: 8%;
                    margin-bottom: 5.5%;

                    >img {
                        width: 320px;
                        height: 42px;
                    }
                }

                .line {
                    width: 60%;
                    height: 10%;
                    color: rgb(0, 0, 0);
                    margin-top: 4%;

                    .line-span {
                        width: 18%;
                        height: 100%;
                        display: flex;
                        align-items: center;
                        justify-content: flex-end;
                        padding-right: 10px;
                    }

                    .line-value {
                        width: 0;
                        height: 100%;
                        flex: 1;
                    }

                    .line-but {
                        width: auto;
                        height: 60%;
                        padding: 0 15px;
                        margin: 0 0 0 15px;

                        color: #fff;
                        font-size: 15px;
                        border-radius: 8px;
                        transition: 0.3s;
                        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12), 0 0 6px rgba(0, 0, 0, 0.04);

                        &:hover {
                            cursor: pointer;

                        }
                    }

                    .line-but-disable {


                        &:hover {

                            cursor: not-allowed;
                        }
                    }
                }

                .line-radio {
                    width: 80%;
                    height: auto;
                    margin-top: 5%;

                    .el-radio-group {
                        width: 90%;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;

                        .el-radio {
                            color: #fff;
                        }
                    }
                }

                .line-login {
                    width: 60%;
                    height: 50px;
                    //
                    background-color: #1b4bf5;
                    color: #fff;
                    font-size: 18px;
                    border-radius: 4px;
                    margin-top: 4%;
                    letter-spacing: 10px;
                    // font-weight: bolder;
                    transition: 0.3s;


                    &:hover {
                        cursor: pointer;
                        //
                    }
                }

                .line-txt {
                    width: 60%;
                    margin-top: 10px;
                    display: flex;
                    justify-content: center;
                    align-items: center;

                    >span {
                        // display: block;
                        margin: 0 15px;
                        font-size: 16px;

                        vertical-align: middle;

                        >a {
                            text-decoration: none;
                            color: #0a58ca;

                            &:hover {
                                color: #0686fd;
                                text-decoration: #0686fd underline;
                                cursor: pointer;
                            }
                        }

                    }

                    .lxtxt {
                        text-decoration: underline;
                        cursor: pointer;
                        // height: 120px;
                        // width: 120px;

                        img {
                            width: 90px;
                        }
                    }


                }

                .line-tip {
                    width: 100%;
                    height: auto;
                    margin-top: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    font-size: 13px;
                    color: #0686fd;
                    transition: 0.3s;
                    padding-right: 20%;

                    &:hover {
                        cursor: pointer;
                        color: #ff5202;
                    }
                }
            }

            .botm {
                width: 100%;
                height: 50px;
                // position: absolute;
                bottom: 0;
                display: flex;
                justify-content: center;
                font-size: 15px;
                // font-family: "MyFont";

                >a {
                    text-decoration: none;

                    &:hover {
                        color: #0686fd;
                    }
                }
            }
        }


    }



    .dialogcontent {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;

        .content-line {
            width: 100%;
            height: auto;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;

            .lien {
                width: 100%;
                height: 30px;
                margin: 3px 0;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;

                transition: 0.3s;

                &:hover {
                    cursor: pointer;

                    text-decoration: underline;
                }
            }
        }
    }
}
</style>

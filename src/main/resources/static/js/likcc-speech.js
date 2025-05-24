// 语音朗读组件
(function() {
    // 检查浏览器是否支持语音合成API
    const checkSpeechSynthesis = () => typeof window.speechSynthesis !== 'undefined';

    // 等待语音合成API就绪并加载语音
    const waitForVoices = () => new Promise(resolve => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            resolve();
        } else {
            window.speechSynthesis.onvoiceschanged = resolve;
        }
    });

    // 创建带有指定标签、类名和文本内容的DOM元素
    const createElement = (tag, className, textContent = '') => {
        const el = document.createElement(tag);
        if (className) el.className = className;
        if (textContent) el.textContent = textContent;
        return el;
    };

    // 显示错误提示信息
    const showError = (errorElement, message) => {
        errorElement.textContent = message;
        errorElement.classList.add('show');
        setTimeout(() => {
            errorElement.classList.remove('show');
        }, 3000);
    };

    // 创建语音朗读按钮组件的主函数
    window.createLikccSpeech = async function(options = {}) {
        // 解构配置选项，并设置默认值
        const {
            target = document.body,  // 目标容器，默认body
            postName = '',          // 文章名称
            position = 'right',     // 按钮默认位置：'left' | 'right'
            margin = '10px',        // 按钮默认边距
            size = '50px',         // 按钮默认大小
            defaultSpeed = 1.3,     // 默认语速：0.5-2
            theme = '',            // 主题：'dark' | 'pink' | ''
            layout = '',           // 布局：'compact' | 'large' | ''
            animation = '',        // 动画：'smooth' | 'bounce' | ''
            buttonStyle = '',      // 按钮样式：'square' | 'circle' | 'capsule' | ''
            progressStyle = '',    // 进度条样式：'square' | 'circle' | ''
            shadowStyle = ''       // 阴影样式：'none' | 'large' | ''
        } = options;

        // 创建主容器元素
        const btnContainer = createElement('div', 'likcc-speech-container');

        // 应用主题类
        if (theme) {
            btnContainer.classList.add(`likcc-speech-theme-${theme}`);
        }

        // 应用布局类
        if (layout) {
            btnContainer.classList.add(`likcc-speech-layout-${layout}`);
        }

        // 应用动画类
        if (animation) {
            btnContainer.classList.add(`likcc-speech-animation-${animation}`);
        }

        // 应用按钮样式类
        if (buttonStyle) {
            btnContainer.classList.add(`likcc-speech-btn-${buttonStyle}`);
        }

        // 应用进度条样式类
        if (progressStyle) {
            btnContainer.classList.add(`likcc-speech-progress-${progressStyle}`);
        }

        // 应用阴影样式类
        if (shadowStyle) {
            btnContainer.classList.add(`likcc-speech-shadow-${shadowStyle}`);
        }

        // 设置按钮容器位置和方向，只支持左或右
        switch(position) {
            case 'left':
                btnContainer.classList.add('pos-left');
                btnContainer.style.left = margin;
                 btnContainer.style.flexDirection = 'row-reverse'; // 左侧时按钮顺序反转
                break;
            case 'right':
                 btnContainer.classList.add('pos-right');
                btnContainer.style.right = margin;
                break;
            // 默认靠右
            default:
                 btnContainer.classList.add('pos-right');
                btnContainer.style.right = margin;
                break;
        }

        // 创建主播放/暂停按钮
        const btn = createElement('div', 'likcc-speech-btn');
        btn.title = '正在初始化...';
        btn.style.width = size;
        btn.style.height = size;
        btn.classList.add('loading');

        // 创建错误提示元素
        const errorTip = createElement('div', 'likcc-speech-error');
        btnContainer.appendChild(errorTip);

        // 创建进度条元素
        const progress = createElement('div', 'likcc-speech-progress');
        // 创建10条进度条线
        for (let i = 0; i < 10; i++) {
            const line = createElement('i', '');
            line.style.setProperty('--child-pct', '0%'); // 初始化进度为0
            progress.appendChild(line);
        }

        // 创建图标元素
        const icon = createElement('div', 'likcc-speech-icon');

        // 将进度条和图标添加到主按钮中
        btn.appendChild(progress);
        btn.appendChild(icon);

        // 将主按钮添加到容器中
        btnContainer.appendChild(btn);

        // 将组件容器添加到目标元素中
        target.appendChild(btnContainer);

        let utterance = null; // 语音合成对象
        let isPlaying = false; // 是否正在播放
        let isInitialized = false; // 是否已初始化
        const progressLines = btn.querySelectorAll('.likcc-speech-progress i'); // 进度条线条元素列表

        // 更新进度条显示
        const updateProgress = (progress) => {
             progressLines.forEach((line, index) => {
                const start = index * 10;
                const end = (index + 1) * 10;
                let pct = 0;
                if (progress >= end) { pct = 100; } else if (progress >= start) { pct = ((progress - start) / (end - start)) * 100; }
                line.style.setProperty('--child-pct', `${pct}%`);
            });
        };

        // 重置播放状态到初始
        const resetState = () => {
             isPlaying = false;
             btn.title = '开始朗读';
             btn.classList.remove('playing', 'paused');
             btn.classList.add('ready');
             icon.classList.remove('pause');
             updateProgress(0);
             utterance = null;
        };

        // 获取文章内容
        let content = '';
        try {
            const response = await fetch('/apis/api.postspeech.lik.cc/v1alpha1/postspeech/content/' + postName);
            content = await response.text();
            if (!content || content.trim() === '') {
                throw new Error('文章内容为空');
            }
            btn.title = '开始朗读';
            btn.classList.remove('loading');
            btn.classList.add('ready');
        } catch (error) {
            console.error('获取文章内容失败:', error);
            showError(errorTip, '获取文章内容失败');
            btn.classList.remove('loading');
            btn.classList.add('disabled');
            btn.title = '获取文章内容失败';
            return null;
        }

        // 检查语音合成API支持情况
        if (!checkSpeechSynthesis()) {
            showError(errorTip, '您的浏览器不支持语音合成');
            btn.classList.remove('loading');
            btn.classList.add('disabled');
            btn.title = '不支持语音合成';
            return null;
        }

        // 播放/暂停切换功能
        const togglePlay = async () => {
            // 如果组件未初始化，显示错误并返回
            if (!isInitialized) {
                showError(errorTip, '语音合成未就绪');
                return;
            }

            // 如果正在播放，则暂停
            if (isPlaying) {
                window.speechSynthesis.pause();
                isPlaying = false;
                btn.title = '继续朗读';
                btn.classList.remove('playing');
                btn.classList.add('paused');
                icon.classList.remove('pause');
            } else {
                // 如果已暂停，则恢复；否则创建新的语音合成对象并开始播放
                try {
                    if (window.speechSynthesis.paused) {
                        window.speechSynthesis.resume();
                    } else {
                        // 如果有正在进行的语音，取消它
                        if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
                            window.speechSynthesis.cancel();
                        }

                        // 创建新的语音合成对象
                        utterance = new SpeechSynthesisUtterance(content);
                        utterance.rate = defaultSpeed; // 应用默认语速

                        // 监听语音合成开始事件
                        utterance.onstart = () => {
                            isPlaying = true;
                            btn.title = '暂停朗读';
                            btn.classList.remove('paused', 'ready');
                            btn.classList.add('playing');
                            icon.classList.add('pause');
                            updateProgress(0);
                        };

                        // 监听语音合成结束事件
                        utterance.onend = resetState;

                        // 监听语音合成错误事件
                        utterance.onerror = (event) => {
                            // 只有在非页面刷新导致的错误时才显示错误提示
                            if (!event.error || event.error !== 'interrupted') {
                                showError(errorTip, '语音合成出错');
                            }
                            resetState();
                        };

                        // 监听语音合成进度事件
                        utterance.onboundary = (event) => {
                            const progress = Math.min(100, Math.round((event.charIndex / content.length) * 100 * 100) / 100);
                            updateProgress(progress);
                        };

                        // 开始语音合成
                        window.speechSynthesis.speak(utterance);
                    }

                    // 更新按钮状态为播放中
                    isPlaying = true;
                    btn.title = '暂停朗读';
                    btn.classList.remove('paused', 'ready');
                    btn.classList.add('playing');
                    icon.classList.add('pause');

                } catch (error) {
                    showError(errorTip, '播放失败，请重试');
                    resetState();
                }
            }
        };

        // 为主按钮添加点击事件监听器
        btn.addEventListener('click', togglePlay);

        // 页面卸载前取消语音合成
        window.addEventListener('beforeunload', () => {
            if (isPlaying || window.speechSynthesis.pending || window.speechSynthesis.paused) {
                window.speechSynthesis.cancel();
            }
        });

        // 初始化加载状态
        btn.classList.add('loading');
        try {
            // 等待语音加载完成
            await waitForVoices();
            isInitialized = true;
            btn.classList.remove('loading');
            btn.title = '开始朗读';
        } catch (error) {
            // 初始化失败处理
            showError(errorTip, '语音合成初始化失败，功能不可用');
            btn.classList.remove('loading');
             btn.classList.add('disabled');
             btn.title = '语音合成不可用';
             btn.removeEventListener('click', togglePlay); // 移除点击事件
             return null;
         }

        // 返回组件控制接口
        return {
            // 播放
            play: () => !isPlaying && togglePlay(),
            // 暂停
            pause: () => isPlaying && togglePlay(),
            // 停止
            stop: () => {
                if (window.speechSynthesis.speaking || window.speechSynthesis.pending || window.speechSynthesis.paused) {
                    window.speechSynthesis.cancel();
                    resetState();
                }
            },
            // 设置语速
            setSpeed: (speed) => {
                if (utterance) {
                    utterance.rate = speed;
                    // 如果正在播放，重新开始以应用新语速
                    if(window.speechSynthesis.speaking) {
                         window.speechSynthesis.cancel();
                         window.speechSynthesis.speak(utterance);
                     }
                }
            },
            // 检查是否已准备好
            isReady: () => isInitialized,
            // 动态样式控制方法（保留通过JS修改样式）
            setTheme: (newTheme) => {
                btnContainer.classList.remove('likcc-speech-theme-dark', 'likcc-speech-theme-pink');
                if (newTheme) {
                    btnContainer.classList.add(`likcc-speech-theme-${newTheme}`);
                }
            },
            setLayout: (newLayout) => {
                btnContainer.classList.remove('likcc-speech-layout-compact', 'likcc-speech-layout-large');
                if (newLayout) {
                    btnContainer.classList.add(`likcc-speech-layout-${newLayout}`);
                }
            },
            setAnimation: (newAnimation) => {
                btnContainer.classList.remove('likcc-speech-animation-smooth', 'likcc-speech-animation-bounce');
                if (newAnimation) {
                    btnContainer.classList.add(`likcc-speech-animation-${newAnimation}`);
                }
            },
            setButtonStyle: (newStyle) => {
                btnContainer.classList.remove('likcc-speech-btn-square', 'likcc-speech-btn-circle', 'likcc-speech-btn-capsule');
                if (newStyle) {
                    btnContainer.classList.add(`likcc-speech-btn-${newStyle}`);
                }
            },
            setProgressStyle: (newStyle) => {
                btnContainer.classList.remove('likcc-speech-progress-square', 'likcc-speech-progress-circle');
                if (newStyle) {
                    btnContainer.classList.add(`likcc-speech-progress-${newStyle}`);
                }
            },
            setShadowStyle: (newStyle) => {
                btnContainer.classList.remove('likcc-speech-shadow-none', 'likcc-speech-shadow-large');
                if (newStyle) {
                    btnContainer.classList.add(`likcc-speech-shadow-${newStyle}`);
                }
            }
        };
    };
})(); 
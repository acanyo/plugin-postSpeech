// 语音朗读组件
(function() {
    const checkSpeechSynthesis = () => typeof window.speechSynthesis !== 'undefined';

    const waitForVoices = () => new Promise(resolve => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            resolve();
        } else {
            window.speechSynthesis.onvoiceschanged = resolve;
        }
    });

    const createElement = (tag, className, textContent = '') => {
        const el = document.createElement(tag);
        if (className) el.className = className;
        if (textContent) el.textContent = textContent;
        return el;
    };

    const showError = (errorElement, message) => {
        errorElement.textContent = message;
        errorElement.classList.add('show');
        setTimeout(() => errorElement.classList.remove('show'), 3000);
    };

    const Handsomedebounce = (function() {
        let timeout;
        return function(func, wait) {
            return function() {
                const context = this;
                const args = arguments;
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(context, args), wait);
            };
        };
    })();

    const handlePjax = async function() {
        try {
            if (window.likccSpeechInstance) {
                window.likccSpeechInstance.stop();
                window.likccSpeechInstance = null;
            }

            // 同步清理旧实例容器
            const oldContainer = document.querySelector('.likcc-speech-container');
            if (oldContainer) {
                oldContainer.remove();
            }

            const response = await fetch(window.location.href);
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            const scripts = doc.querySelectorAll('script:not([src])');
            let enableSpeech = false;
            let postName = '';
            let postURL = ''; // 获取 postURL
            
            scripts.forEach(script => {
                if (script.textContent.includes('enableSpeech')) {
                    try {
                        const match = script.textContent.match(/enableSpeech:\s*(true|false)/);
                        if (match && match[1]) enableSpeech = match[1] === 'true';
                    } catch (e) {
                        console.error('[LikccSpeech] 解析enableSpeech配置失败:', e);
                    }
                }
                if (script.textContent.includes('postName')) {
                    try {
                        const match = script.textContent.match(/postName:\s*['"]([^'"]*)['"]/);
                        if (match && match[1]) postName = match[1];
                    } catch (e) {
                        console.error('[LikccSpeech] 解析postName失败:', e);
                    }
                }
                // 获取 postURL
                if (script.textContent.includes('postURL')) {
                    try {
                         const match = script.textContent.match(/postURL:\s*['"]([^'"]*)['"]/);
                        if (match && match[1]) postURL = match[1];
                    } catch (e) {
                        console.error('[LikccSpeech] 解析postURL失败:', e);
                    }
                }
            });

            const currentUrl = window.location.href; // 获取当前URL

            // 整合所有启用条件判断：enableSpeech为true，postName存在且不为'非文章页'，并且路由匹配
            const shouldEnableSpeech = enableSpeech && postName && postName !== '非文章页' && matchPostURL(currentUrl, postURL);

            if (shouldEnableSpeech) {
                try {
                    const contentResponse = await fetch('/apis/api.postspeech.lik.cc/v1alpha1/postspeech/content/' + postName);
                    
                    if (!contentResponse.ok) {
                        const errorText = await contentResponse.text();
                        throw new Error(`获取文章内容失败: ${contentResponse.status} - ${errorText}`);
                    }

                    const content = await contentResponse.text();
                    
                    if (!content || content.trim() === '') {
                        throw new Error('文章内容为空');
                    }

                    // 只有所有条件都满足且成功获取文章内容后，才调用 createLikccSpeech
                    if (!window.likccSpeechInstance) {
                        window.createLikccSpeech({
                            postName,
                            enableSpeech: true, // 此时enableSpeech已经是true，传递true即可
                            content,
                            postURL // 传递 postURL
                        });
                    }
                } catch (error) {
                    console.error('[LikccSpeech] 获取文章内容失败或处理错误:', error);
                    // 可以在这里添加一些错误提示给用户，如果需要的话
                }
            } else {
                 // 如果不满足启用条件（包括路由不匹配），确保清理旧实例
                 if (window.likccSpeechInstance) {
                    window.likccSpeechInstance.stop();
                    const oldContainer = document.querySelector('.likcc-speech-container');
                    if (oldContainer) oldContainer.remove();
                    window.likccSpeechInstance = null;
                }
            }

        } catch (error) {
            console.error('[LikccSpeech] 语音组件Pjax处理错误:', error);
        }
    };

    const debouncedHandlePjax = Handsomedebounce(handlePjax, 300);

    document.addEventListener('DOMContentLoaded', debouncedHandlePjax);
    document.addEventListener('pjax:complete', debouncedHandlePjax);
    document.addEventListener('page:load', debouncedHandlePjax);
    document.addEventListener('turbolinks:load', debouncedHandlePjax);

    document.addEventListener('pjax:start', () => {
        if (window.likccSpeechInstance) {
            window.likccSpeechInstance.stop();
            window.likccSpeechInstance = null;
        }
    });

    document.addEventListener('pjax:error', () => {
        if (window.likccSpeechInstance) {
            window.likccSpeechInstance.stop();
            window.likccSpeechInstance = null;
        }
    });

    // 辅助函数：检查当前URL是否匹配postURL模式
    const matchPostURL = (currentUrl, postUrlPattern) => {
        if (!postUrlPattern) {
            return true; // 如果没有设置postURL模式，则默认匹配
        }
        // 将简单的通配符*转换为正则表达式的一部分
        const regexPattern = '^' + postUrlPattern.replace(/\*/g, '.*') + '$';
        try {
            const regex = new RegExp(regexPattern);
            return regex.test(currentUrl);
        } catch (e) {
            console.error('[LikccSpeech] 无效的postURL模式:', postUrlPattern, e);
            return false; // 无效的模式不匹配
        }
    };

    window.createLikccSpeech = async function(options = {}) {
        const {
            target = document.body,
            postName = '',
            position = 'right',
            margin = '10px',
            size = '50px',
            defaultSpeed = 1.3,
            enableSpeech = true,
            theme = '',
            layout = '',
            animation = '',
            buttonStyle = '',
            progressStyle = '',
            shadowStyle = '',
            content = '',
            postURL = ''
        } = options;

        // 移除了重复的 enableSpeech, postName, postURL 判断
        // 这些判断已在 handlePjax 中完成

        if (!checkSpeechSynthesis()) {
            console.error('[LikccSpeech] 浏览器不支持语音合成');
            return null;
        }

        try {
            await waitForVoices();
        } catch (error) {
            console.error('[LikccSpeech] 等待语音合成API就绪失败:', error);
            return null;
        }

        if (window.likccSpeechInstance) {
            window.likccSpeechInstance.stop();
            const oldContainer = document.querySelector('.likcc-speech-container');
            if (oldContainer) oldContainer.remove();
        }

        const btnContainer = createElement('div', 'likcc-speech-container');
        if (theme) btnContainer.classList.add(`likcc-speech-theme-${theme}`);
        if (layout) btnContainer.classList.add(`likcc-speech-layout-${layout}`);
        if (animation) btnContainer.classList.add(`likcc-speech-animation-${animation}`);
        if (buttonStyle) btnContainer.classList.add(`likcc-speech-btn-${buttonStyle}`);
        if (progressStyle) btnContainer.classList.add(`likcc-speech-progress-${progressStyle}`);
        if (shadowStyle) btnContainer.classList.add(`likcc-speech-shadow-${shadowStyle}`);

        switch(position) {
            case 'left':
                btnContainer.classList.add('pos-left');
                btnContainer.style.left = margin;
                btnContainer.style.flexDirection = 'row-reverse';
                break;
            default:
                btnContainer.classList.add('pos-right');
                btnContainer.style.right = margin;
                break;
        }

        const btn = createElement('div', 'likcc-speech-btn');
        btn.title = '正在初始化...';
        btn.style.width = size;
        btn.style.height = size;
        btn.classList.add('loading');

        const errorTip = createElement('div', 'likcc-speech-error');
        btnContainer.appendChild(errorTip);

        const progress = createElement('div', 'likcc-speech-progress');
        const icon = createElement('div', 'likcc-speech-icon');
        btn.appendChild(progress);
        btn.appendChild(icon);

        // 添加百分比显示元素
        const percentageElement = createElement('div', 'likcc-speech-percentage');
        btnContainer.appendChild(percentageElement);

        btnContainer.appendChild(btn);
        target.appendChild(btnContainer);

        let utterance = null;
        let isPlaying = false;
        let isInitialized = false;

        const resetState = () => {
            isPlaying = false;
            btn.title = '开始朗读';
            btn.classList.remove('playing', 'paused');
            btn.classList.add('ready');
            icon.classList.remove('pause');
            utterance = null;
        };

        let articleContent = content;
        if (!articleContent && articleContent != "") {
            try {
                const response = await fetch('/apis/api.postspeech.lik.cc/v1alpha1/postspeech/content/' + postName);

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`获取文章内容失败: ${response.status} - ${errorText}`);
                }

                articleContent = await response.text();
                if (!articleContent || articleContent.trim() === '') {
                    throw new Error('文章内容为空');
                }
            } catch (error) {
                showError(errorTip, '获取文章内容失败');
                btn.classList.remove('loading');
                btn.classList.add('disabled');
                btn.title = '获取文章内容失败';
                return null;
            }
        }

        btn.title = '开始朗读';
        btn.classList.remove('loading');
        btn.classList.add('ready');

        const togglePlay = async () => {
            if (!isInitialized) {
                showError(errorTip, '语音合成未就绪');
                return;
            }

            if (isPlaying) {
                isPlaying = false;
                btn.title = '继续朗读';
                btn.classList.remove('playing');
                btn.classList.add('paused');
                icon.classList.remove('pause');

                // Then pause speech synthesis
                window.speechSynthesis.pause();
            } else {
                try {
                    if (window.speechSynthesis.paused) {
                        // 从暂停处继续播放
                        window.speechSynthesis.resume();
                        
                        // 更新状态为播放中
                        isPlaying = true;
                        btn.title = '暂停朗读';
                        btn.classList.remove('paused', 'ready'); // 移除暂停和准备状态
                        btn.classList.add('playing');
                        icon.classList.add('pause');

                    } else { 
                        // 不是暂停状态，开始新播放
                        if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
                            window.speechSynthesis.cancel();
                        }

                        utterance = new SpeechSynthesisUtterance(articleContent);
                        utterance.rate = defaultSpeed;

                        utterance.onstart = () => {
                            isPlaying = true;
                            btn.title = '暂停朗读';
                            btn.classList.remove('paused', 'ready');
                            btn.classList.add('playing');
                            icon.classList.add('pause');
                            percentageElement.classList.add('show');
                        };

                        utterance.onend = () => {
                            resetState();
                            percentageElement.classList.remove('show');
                        };

                        utterance.onerror = (event) => {
                            console.error('[LikccSpeech] 语音播放错误 (onerror):', event);
                            if (!event.error || event.error !== 'interrupted') {
                                showError(errorTip, '语音合成出错');
                            }
                            resetState();
                            percentageElement.classList.remove('show');
                        };

                        utterance.onboundary = (event) => {
                            const progress = Math.min(100, Math.round((event.charIndex / articleContent.length) * 100 * 100) / 100);
                            percentageElement.textContent = `${Math.round(progress)}%`;
                            percentageElement.classList.add('show');
                            // 触发脉冲动画
                            percentageElement.classList.remove('pulsing');
                            void percentageElement.offsetWidth;
                            percentageElement.classList.add('pulsing');
                        };

                        window.speechSynthesis.speak(utterance);
                        
                        // 第一次开始新播放时设置状态
                        isPlaying = true;
                        btn.title = '暂停朗读';
                        btn.classList.remove('paused', 'ready');
                        btn.classList.add('playing');
                        icon.classList.add('pause');
                    }

                } catch (error) {
                    console.error('[LikccSpeech] 播放失败:', error);
                    showError(errorTip, '播放失败，请重试');
                    resetState();
                }
            }
        };

        btn.addEventListener('click', togglePlay);

        window.addEventListener('beforeunload', () => {
            if (isPlaying || window.speechSynthesis.pending || window.speechSynthesis.paused) {
                window.speechSynthesis.cancel();
            }
        });

        btn.classList.add('loading');
        try {
            await waitForVoices();
            isInitialized = true;
            btn.classList.remove('loading');
            btn.title = '开始朗读';
        } catch (error) {
            console.error('[LikccSpeech] 语音组件初始化失败:', error);
            showError(errorTip, '语音合成初始化失败，功能不可用');
            btn.classList.remove('loading');
            btn.classList.add('disabled');
            btn.title = '语音合成不可用';
            btn.removeEventListener('click', togglePlay);
            return null;
        }

        const instance = {
            play: () => !isPlaying && togglePlay(),
            pause: () => isPlaying && togglePlay(),
            stop: () => {
                if (window.speechSynthesis.speaking || window.speechSynthesis.pending || window.speechSynthesis.paused) {
                    window.speechSynthesis.cancel();
                    resetState();
                }
            },
            setSpeed: (speed) => {
                if (utterance) {
                    utterance.rate = speed;
                    if(window.speechSynthesis.speaking) {
                        window.speechSynthesis.cancel();
                        window.speechSynthesis.speak(utterance);
                    }
                }
            },
            isReady: () => isInitialized,
            destroy: () => {
                this.stop();
                if (btnContainer && btnContainer.parentNode) {
                    btnContainer.parentNode.removeChild(btnContainer);
                }
                window.likccSpeechInstance = null;
            }
        };

        window.likccSpeechInstance = instance;
        return instance;
    };
})(); 
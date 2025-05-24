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
            console.log('[LikccSpeech] Pjax切换开始，清理旧实例');
            if (window.likccSpeechInstance) {
                window.likccSpeechInstance.stop();
                const oldContainer = document.querySelector('.likcc-speech-container');
                if (oldContainer) oldContainer.remove();
                window.likccSpeechInstance = null;
            }

            console.log('[LikccSpeech] 获取新页面配置');
            const response = await fetch(window.location.href);
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            const scripts = doc.querySelectorAll('script:not([src])');
            let enableSpeech = false;
            let postName = '';
            
            scripts.forEach(script => {
                if (script.textContent.includes('enableSpeech')) {
                    try {
                        const match = script.textContent.match(/enableSpeech:\s*(true|false)/);
                        if (match && match[1]) enableSpeech = match[1] === 'true';
                        console.log('[LikccSpeech] 解析到enableSpeech:', enableSpeech);
                    } catch (e) {
                        console.error('[LikccSpeech] 解析enableSpeech配置失败:', e);
                    }
                }
                if (script.textContent.includes('postName')) {
                    try {
                        const match = script.textContent.match(/postName:\s*['"]([^'"]*)['"]/);
                        if (match && match[1]) postName = match[1];
                        console.log('[LikccSpeech] 解析到postName:', postName);
                    } catch (e) {
                        console.error('[LikccSpeech] 解析postName失败:', e);
                    }
                }
            });

            if (enableSpeech && postName) {
                try {
                    console.log('[LikccSpeech] 获取新文章内容:', postName);
                    const contentResponse = await fetch('/apis/api.postspeech.lik.cc/v1alpha1/postspeech/content/' + postName);
                    const content = await contentResponse.text();
                    
                    if (!content || content.trim() === '') {
                        throw new Error('文章内容为空');
                    }
                    console.log('[LikccSpeech] 获取到文章内容长度:', content.length);

                    console.log('[LikccSpeech] 初始化新语音组件');
                    window.createLikccSpeech({
                        postName,
                        enableSpeech: true,
                        content
                    });
                } catch (error) {
                    console.error('[LikccSpeech] 获取文章内容失败:', error);
                }
            } else {
                console.log('[LikccSpeech] 未启用语音或未找到文章名称');
            }
        } catch (error) {
            console.error('[LikccSpeech] 语音组件Pjax处理错误:', error);
        }
    };

    const debouncedHandlePjax = Handsomedebounce(handlePjax, 100);

    document.addEventListener('DOMContentLoaded', debouncedHandlePjax);
    document.addEventListener('pjax:complete', debouncedHandlePjax);
    document.addEventListener('page:load', debouncedHandlePjax);
    document.addEventListener('turbolinks:load', debouncedHandlePjax);

    document.addEventListener('pjax:start', () => {
        if (window.likccSpeechInstance) {
            window.likccSpeechInstance.stop();
            const oldContainer = document.querySelector('.likcc-speech-container');
            if (oldContainer) oldContainer.remove();
            window.likccSpeechInstance = null;
        }
    });

    document.addEventListener('pjax:error', () => {
        if (window.likccSpeechInstance) {
            window.likccSpeechInstance.stop();
            const oldContainer = document.querySelector('.likcc-speech-container');
            if (oldContainer) oldContainer.remove();
            window.likccSpeechInstance = null;
        }
    });

    window.createLikccSpeech = async function(options = {}) {
        console.log('[LikccSpeech] 开始创建语音组件:', options);
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
            content = ''
        } = options;

        if (!enableSpeech) {
            console.log('[LikccSpeech] 语音功能未启用');
            if (window.likccSpeechInstance) {
                window.likccSpeechInstance.stop();
                const oldContainer = document.querySelector('.likcc-speech-container');
                if (oldContainer) oldContainer.remove();
                window.likccSpeechInstance = null;
            }
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
        for (let i = 0; i < 10; i++) {
            const line = createElement('i', '');
            line.style.setProperty('--child-pct', '0%');
            progress.appendChild(line);
        }

        const icon = createElement('div', 'likcc-speech-icon');
        btn.appendChild(progress);
        btn.appendChild(icon);
        btnContainer.appendChild(btn);
        target.appendChild(btnContainer);

        let utterance = null;
        let isPlaying = false;
        let isInitialized = false;
        const progressLines = btn.querySelectorAll('.likcc-speech-progress i');

        const updateProgress = (progress) => {
            progressLines.forEach((line, index) => {
                const start = index * 10;
                const end = (index + 1) * 10;
                let pct = 0;
                if (progress >= end) pct = 100;
                else if (progress >= start) pct = ((progress - start) / (end - start)) * 100;
                line.style.setProperty('--child-pct', `${pct}%`);
            });
        };

        const resetState = () => {
            isPlaying = false;
            btn.title = '开始朗读';
            btn.classList.remove('playing', 'paused');
            btn.classList.add('ready');
            icon.classList.remove('pause');
            updateProgress(0);
            utterance = null;
        };

        let articleContent = content;
        if (!articleContent) {
            try {
                const response = await fetch('/apis/api.postspeech.lik.cc/v1alpha1/postspeech/content/' + postName);
                articleContent = await response.text();
                if (!articleContent || articleContent.trim() === '') {
                    throw new Error('文章内容为空');
                }
            } catch (error) {
                console.error('获取文章内容失败:', error);
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

        if (!checkSpeechSynthesis()) {
            showError(errorTip, '您的浏览器不支持语音合成');
            btn.classList.remove('loading');
            btn.classList.add('disabled');
            btn.title = '不支持语音合成';
            return null;
        }

        const togglePlay = async () => {
            if (!isInitialized) {
                showError(errorTip, '语音合成未就绪');
                return;
            }

            if (isPlaying) {
                window.speechSynthesis.pause();
                isPlaying = false;
                btn.title = '继续朗读';
                btn.classList.remove('playing');
                btn.classList.add('paused');
                icon.classList.remove('pause');
            } else {
                try {
                    if (window.speechSynthesis.paused) {
                        window.speechSynthesis.resume();
                    } else {
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
                            updateProgress(0);
                        };

                        utterance.onend = resetState;

                        utterance.onerror = (event) => {
                            if (!event.error || event.error !== 'interrupted') {
                                showError(errorTip, '语音合成出错');
                            }
                            resetState();
                        };

                        utterance.onboundary = (event) => {
                            const progress = Math.min(100, Math.round((event.charIndex / articleContent.length) * 100 * 100) / 100);
                            updateProgress(progress);
                        };

                        window.speechSynthesis.speak(utterance);
                    }

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
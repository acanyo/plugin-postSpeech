package cc.lik.postSpeech.process;

import cc.lik.postSpeech.service.SettingConfigGetter;
import java.util.Properties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.PropertyPlaceholderHelper;
import org.thymeleaf.context.ITemplateContext;
import org.thymeleaf.model.IModel;
import org.thymeleaf.model.IModelFactory;
import org.thymeleaf.processor.element.IElementModelStructureHandler;
import reactor.core.publisher.Mono;
import run.halo.app.theme.dialect.TemplateHeadProcessor;

@Component
@RequiredArgsConstructor
public class PostSpeechProcess implements TemplateHeadProcessor {

    static final PropertyPlaceholderHelper
        PROPERTY_PLACEHOLDER_HELPER = new PropertyPlaceholderHelper("${", "}");

    private final SettingConfigGetter settingConfigGetter;

    @Override
    public Mono<Void> process(ITemplateContext iTemplateContext, IModel iModel,
        IElementModelStructureHandler iElementModelStructureHandler) {
        final IModelFactory modelFactory = iTemplateContext.getModelFactory();
        String name = iTemplateContext.getVariable("name") == null ? null : iTemplateContext.getVariable("name").toString();
        boolean isPost = name != null && !name.isEmpty();
        
        return settingConfigGetter.getBasicConfig()
            .flatMap(config -> {
                String fullScript = setJavaScript(config, isPost, name != null ? name : "非文章页");
                iModel.add(modelFactory.createText(fullScript));
                return Mono.empty();
            });
    }

    private String setJavaScript(SettingConfigGetter.BasicConfig config, boolean isPost, String postName) {
        final Properties properties = setJsValue(config, isPost, postName);

        return PROPERTY_PLACEHOLDER_HELPER.replacePlaceholders("""
            <!-- postSpeech start-->
            <link rel="stylesheet" href="${cssUrl}" />
            <script src="${scriptUrl}"></script>
            <script>
                const initSpeech = () => {
                    if (window.likccSpeechInstance) {
                        window.likccSpeechInstance.stop();
                    }
                    createLikccSpeech({
                        position: '${position}',
                        defaultSpeed: ${defaultSpeed},
                        postName: '${postName}',
                        enableSpeech: ${enableSpeech}
                    });
                };
                document.addEventListener('DOMContentLoaded', initSpeech);
                document.addEventListener('pjax:success', initSpeech);
            </script>
            <!-- postSpeech end-->
            """, properties);
    }

    private static Properties setJsValue(SettingConfigGetter.BasicConfig config, boolean isPost, String postName) {
        final Properties properties = new Properties();
        properties.setProperty("position", config.getPosition());
        properties.setProperty("defaultSpeed", String.valueOf(config.getSpeechAloud() != null ? config.getSpeechAloud() : 1.3));
        properties.setProperty("postName", postName);
        properties.setProperty("cssUrl", config.getSpeechStyle() != null ? config.getSpeechStyle() : Constant.CSS_URL);
        properties.setProperty("scriptUrl", Constant.SCRIPT_URL);
        properties.setProperty("enableSpeech", String.valueOf(config.getEnableSpeech() && isPost));
        return properties;
    }
}
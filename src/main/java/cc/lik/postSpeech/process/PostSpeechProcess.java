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
import run.halo.app.extension.ReactiveExtensionClient;
import run.halo.app.plugin.ReactiveSettingFetcher;
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
        
        if (name != null && !name.isEmpty()) {
            return insertSpeechScript(iModel, modelFactory);
        }
        return Mono.empty();
    }

    private Mono<Void> insertSpeechScript(IModel iModel, IModelFactory modelFactory) {
        return settingConfigGetter.getBasicConfig()
            .flatMap(config -> {
                // 如果未启用语音功能，直接返回
                if (Boolean.FALSE.equals(config.getEnableSpeech())) {
                    return Mono.empty();
                }

                // 添加 CSS 和 JS 文件
                String cssTag = String.format("<link rel=\"stylesheet\" href=\"%s\" />", 
                    config.getSpeechStyle() != null ? config.getSpeechStyle() : Constant.CSS_URL);
                String fullScript = setJavaScript(config, cssTag);
                iModel.add(modelFactory.createText(fullScript));
                return Mono.empty();
            });
    }

    private String setJavaScript(SettingConfigGetter.BasicConfig config, String cssTag) {
        final Properties properties = setJavaScript(config);

        return PROPERTY_PLACEHOLDER_HELPER.replacePlaceholders("""
            <!-- postSpeech start-->
            <link rel="stylesheet" href="${cssUrl}" />
            <script src="${scriptUrl}"></script>
            <script>
                document.addEventListener('DOMContentLoaded', () => {
                    const speech = createLikccSpeech({
                        position: '${position}',
                        defaultSpeed: ${defaultSpeed},
                        postName: '${postName}'
                    });
                });
            </script>
            <!-- postSpeech end-->
            """, properties);
    }

    private static Properties setJavaScript(SettingConfigGetter.BasicConfig config) {
        final Properties properties = new Properties();
        properties.setProperty("position", config.getPosition());
        properties.setProperty("defaultSpeed", String.valueOf(
            config.getSpeechAloud() != null ? config.getSpeechAloud() : 1.3));
        properties.setProperty("postName", "5152aea5-c2e8-4717-8bba-2263d46e19d5");
        properties.setProperty("cssUrl", config.getSpeechStyle() != null ? config.getSpeechStyle() : Constant.CSS_URL);
        properties.setProperty("scriptUrl", Constant.SCRIPT_URL);
        return properties;
    }
}
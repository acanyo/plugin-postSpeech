package cc.lik.postSpeech.service;

import lombok.Data;
import reactor.core.publisher.Mono;

/**
 * 配置获取接口
 */
public interface SettingConfigGetter {

    /**
     * 获取基本配置
     * @return 基本配置
     */
    Mono<BasicConfig> getBasicConfig();

    @Data
    class BasicConfig {
        public static final String GROUP = "basic";
        private Boolean enableSpeech;
        private String speechStyle;
        private String speechAloud;
        private String position;
    }
}

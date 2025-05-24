package cc.lik.postSpeech.endpoint;

import static org.springdoc.core.fn.builders.apiresponse.Builder.responseBuilder;
import static org.springdoc.core.fn.builders.parameter.Builder.parameterBuilder;

import cc.lik.postSpeech.service.PostSpeechService;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springdoc.webflux.core.fn.SpringdocRouteBuilder;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import reactor.core.publisher.Mono;
import run.halo.app.core.extension.endpoint.CustomEndpoint;
import run.halo.app.extension.GroupVersion;

@Slf4j
@Component
@RequiredArgsConstructor
public class postSpeechEndpoint implements CustomEndpoint {
    private final PostSpeechService postSpeechService;

    @Override
    public RouterFunction<ServerResponse> endpoint() {
        final var tag = "api.postspeech.lik.cc/v1alpha1/postspeech";
        return SpringdocRouteBuilder.route()
            .GET("postspeech/content/{name}", this::getArticleContent, builder -> builder
                .operationId("Get article content")
                .tag(tag)
                .description("获取文章内容")
                .parameter(
                    parameterBuilder()
                        .in(ParameterIn.PATH)
                        .name("name")
                        .description("文章名称")
                        .required(true)
                )
                .response(
                    responseBuilder()
                        .implementation(String.class)
                )
            )
            .build();
    }

    Mono<ServerResponse> getArticleContent(ServerRequest serverRequest) {
        String name = serverRequest.pathVariable("name");
        return postSpeechService.articleContent(name)
            .flatMap(content -> {
                // 返回处理后的文本内容
                return ServerResponse.ok()
                    .bodyValue(content);
            })
            .doOnError(error -> log.error("获取文章内容失败, 文章名称: {}", name, error))
            .onErrorResume(error -> ServerResponse.badRequest()
                .bodyValue("获取文章内容失败: " + error.getMessage()));
    }

    @Override
    public GroupVersion groupVersion() {
        return GroupVersion.parseAPIVersion("api.postspeech.lik.cc/v1alpha1");
    }
}

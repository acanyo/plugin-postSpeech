package cc.lik.postSpeech.service.impl;

import cc.lik.postSpeech.service.PostSpeechService;
import lombok.RequiredArgsConstructor;
import org.jsoup.Jsoup;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebInputException;
import reactor.core.publisher.Mono;
import run.halo.app.content.PostContentService;

@Component
@RequiredArgsConstructor
public class PostSpeechServiceImpl implements PostSpeechService {
    private final PostContentService postContentService;
    @Override
    public Mono<String> articleContent(String postName) {
        return postContentService.getReleaseContent(postName)
            .flatMap(contentWrapper -> Mono.just(Jsoup.parse(contentWrapper.getContent()).text()))
            .onErrorResume(e -> Mono.error(() -> new ServerWebInputException("获取文章内容时出错: " + e.getMessage())));
    }
}

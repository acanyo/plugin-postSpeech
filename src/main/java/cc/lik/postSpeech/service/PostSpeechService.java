package cc.lik.postSpeech.service;

import reactor.core.publisher.Mono;

public interface PostSpeechService {
    Mono<String> articleContent(String postName);
}

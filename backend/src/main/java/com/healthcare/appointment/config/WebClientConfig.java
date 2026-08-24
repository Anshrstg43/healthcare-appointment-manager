package com.healthcare.appointment.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    @Value("${app.ai.base-url:https://api.openai.com/v1}")
    private String aiBaseUrl;

    @Bean
    public WebClient openAiWebClient() {
        return WebClient.builder()
            .baseUrl(aiBaseUrl)
            .codecs(configurer -> configurer
                .defaultCodecs()
                .maxInMemorySize(1024 * 1024)) // 1 MB
            .build();
    }
}

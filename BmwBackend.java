import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;

public class BmwBackend {
    public static void main(String[] args) throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress(5000), 0);
        
        server.createContext("/api/diagnose", new HttpHandler() {
            @Override
            public void handle(HttpExchange exchange) throws IOException {
                // Consolidated CORS and configuration headers
                exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
                exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "POST, OPTIONS");
                exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");
                
                if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                    exchange.sendResponseHeaders(204, -1);
                    return;
                }

                if ("POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                    try {
                        InputStream is = exchange.getRequestBody();
                        String body = new String(is.readAllBytes(), StandardCharsets.UTF_8);
                        
                        // Clean extraction of description content
                        String description = body.contains("\"description\":\"") ? 
                            body.split("\"description\":\"")[1].split("\"")[0] : "Empty Report";

                        String apiKey = System.getenv("GEMINI_API_KEY");
                        if (apiKey == null || apiKey.isEmpty()) {
                            sendResponse(exchange, "{\"error\":\"Missing GEMINI_API_KEY on system environment.\"}", 500);
                            return;
                        }

                        // Structured minimal payload targeting the stable gemini-2.5-flash engine
                        // 1. Update the payload string to point to gemini-3.5-flash
                            String prompt = "You are the BMW Global Support Assistant. Analyze vehicle damage: " + description;
                            String jsonPayload = "{\"model\": \"models/gemini-3.5-flash\", \"contents\": [{\"parts\": [{\"text\": \"" + prompt + "\"}]}]}";

                            HttpClient client = HttpClient.newHttpClient();
                            HttpRequest request = HttpRequest.newBuilder()
                        // 2. Update the target Endpoint URL structure to match gemini-3.5-flash
                            .uri(URI.create("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=" + apiKey))
                            .header("Content-Type", "application/json")
                            .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                            .build();

                        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
                        sendResponse(exchange, response.body(), 200);

                    } catch (Exception e) {
                        sendResponse(exchange, "{\"error\":\"Internal operational execution failure.\"}", 500);
                    }
                } else {
                    sendResponse(exchange, "{\"error\":\"Method not allowed\"}", 405);
                }
            }
        });

        System.out.println("Secure BMW Java Backend actively listening on http://localhost:5000");
        server.start();
    }

    private static void sendResponse(HttpExchange exchange, String response, int statusCode) throws IOException {
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        byte[] bytes = response.getBytes(StandardCharsets.UTF_8);
        exchange.sendResponseHeaders(statusCode, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }
}
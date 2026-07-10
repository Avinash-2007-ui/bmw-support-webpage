import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;

public class BmwBackend {
    public static void main(String[] args) throws Exception {
        String portEnv = System.getenv("PORT");
        int port = (portEnv != null) ? Integer.parseInt(portEnv) : 8080;
        
        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
        server.createContext("/api/diagnose", new DiagnoseHandler());
        server.setExecutor(null);
        
        System.out.println("Secure BMW Java Backend actively listening on port: " + port);
        server.start();
    }

    static class DiagnoseHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
            exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "POST, OPTIONS");
            exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");

            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            if ("POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                try {
                    String requestBody = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
                    
                    String userDescription = "";
                    if (requestBody.contains("\"description\"")) {
                        int startIdx = requestBody.indexOf("\"description\"");
                        String remaining = requestBody.substring(startIdx + 13);
                        int firstQuote = remaining.indexOf("\"");
                        int secondQuote = remaining.indexOf("\"", firstQuote + 1);
                        
                        if (firstQuote != -1 && secondQuote != -1) {
                            userDescription = remaining.substring(firstQuote + 1, secondQuote);
                        }
                    }

                    userDescription = userDescription.replace("\"", "\\\"").replace("\n", " ").replace("\r", " ").trim();

                    if (userDescription.isEmpty()) {
                        userDescription = "Generic vehicle telemetry status check requested.";
                    }

                    String apiKey = System.getenv("GEMINI_API_KEY");
                    if (apiKey == null || apiKey.isEmpty()) {
                        throw new IllegalStateException("GEMINI_API_KEY environment variable is not configured.");
                    }

                    String instructionPrompt = "You are the BMW Global Support Assistant. Provide professional, short, actionable diagnostic telemetry steps for this issue: " + userDescription;
                    String jsonPayload = "{\"contents\":[{\"parts\":[{\"text\":\"" + instructionPrompt + "\"}]}]}";

                    // SWAPPED HERE: Updated endpoint target parameter string link directly to gemini-3.5-flash
                    HttpClient client = HttpClient.newHttpClient();
                    HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=" + apiKey))
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                        .build();

                    HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
                    
                    byte[] responseBytes = response.body().getBytes(StandardCharsets.UTF_8);
                    exchange.getResponseHeaders().set("Content-Type", "application/json");
                    exchange.sendResponseHeaders(200, responseBytes.length);
                    
                    OutputStream os = exchange.getResponseBody();
                    os.write(responseBytes);
                    os.close();

                } catch (Exception e) {
                    e.printStackTrace();
                    String errorMsg = "{\"error\":\"Internal Server Error: " + e.getMessage() + "\"}";
                    byte[] errorBytes = errorMsg.getBytes(StandardCharsets.UTF_8);
                    exchange.sendResponseHeaders(500, errorBytes.length);
                    OutputStream os = exchange.getResponseBody();
                    os.write(errorBytes);
                    os.close();
                }
            } else {
                exchange.sendResponseHeaders(405, -1);
            }
        }
    }
}
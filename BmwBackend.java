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
        // Read the environment port dynamically provided by the cloud
        String portEnv = System.getenv("PORT");
        int port = (portEnv != null) ? Integer.parseInt(portEnv) : 8080;
        
        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
        
        // Map the diagnostic API endpoint route
        server.createContext("/api/diagnose", new DiagnoseHandler());
        
        // Handle global thread execution safely
        server.setExecutor(null);
        
        System.out.println("Secure BMW Java Backend actively listening on port: " + port);
        server.start();
    }

    static class DiagnoseHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            // Manage CORS Preflight requirements for cross-origin browser fetching
            exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
            exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "POST, OPTIONS");
            exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");

            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            if ("POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                try {
                    // Read request payload input string
                    String requestBody = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
                    
                    // Extract data text securely from simple JSON format
                    String userDescription = "";
                    if (requestBody.contains("\"description\"")) {
                        int startIdx = requestBody.indexOf("\"description\"") + 14;
                        int endIdx = requestBody.lastIndexOf("\"");
                        // Safe bounds check extraction
                        if (startIdx > 14 && endIdx > startIdx) {
                            userDescription = requestBody.substring(startIdx, endIdx).replace(":", "").replace("{", "").replace("}", "").trim();
                        }
                    }

                    if (userDescription.isEmpty()) {
                        userDescription = "Generic vehicle telemetry status check requested.";
                    }

                    // Fetch the API environment variable securely mapped in Render
                    String apiKey = System.getenv("GEMINI_API_KEY");
                    if (apiKey == null || apiKey.isEmpty()) {
                        throw new IllegalStateException("GEMINI_API_KEY environment variable is not configured.");
                    }

                    // Build clean structured JSON block for the Gemini model target
                    String instructionPrompt = "You are the BMW Global Support Assistant. Provide professional, short, actionable diagnostic telemetry steps for this issue: " + userDescription;
                    String jsonPayload = "{\"contents\":[{\"parts\":[{\"text\":\"" + instructionPrompt + "\"}]}]}";

                    // Run the HTTP handshake with Google's API endpoint network loop
                    HttpClient client = HttpClient.newHttpClient();
                    HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey))
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                        .build();

                    HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
                    
                    // Return response string straight back to the UI panel environment
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
                exchange.sendResponseHeaders(405, -1); // Method Not Allowed
            }
        }
    }
}
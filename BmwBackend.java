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
import java.util.Base64;
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

public class BmwBackend {
    public static void main(String[] args) throws Exception {
        String portEnv = System.getenv("PORT");
        int port = (portEnv != null) ? Integer.parseInt(portEnv) : 8080;
        
        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
        
        // 1. Keep your working diagnostic system intact
        server.createContext("/api/diagnose", new DiagnoseHandler());
        
        // 2. Add the new entry point mapping
        server.createContext("/api/register", new RegisterEmailHandler());
        
        server.setExecutor(null);
        System.out.println("Secure BMW Java Backend actively listening on port: " + port);
        server.start();
    }

    // --- LEAVE YOUR COMPLETE DiagnoseHandler CLASS EXACTLY AS IT IS HERE ---
    static class DiagnoseHandler implements HttpHandler {
        // ... (Keep the whole original diagnostic block here completely untouched) ...
    }

    // --- APPEND THIS NEW CLASS RIGHT BENEATH THE DIAGNOSEHANDLER CLASS ---
    static class RegisterEmailHandler implements HttpHandler {
    @Override
    public void handle(HttpExchange exchange) throws IOException {
        // Apply CORS policies so your GitHub frontend can communicate securely
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
                
                String userEmail = "";
                if (requestBody.contains("\"email\"")) {
                    int startIdx = requestBody.indexOf("\"email\"");
                    String remaining = requestBody.substring(startIdx + 7);
                    int firstQuote = remaining.indexOf("\"");
                    int secondQuote = remaining.indexOf("\"", firstQuote + 1);
                    if (firstQuote != -1 && secondQuote != -1) {
                        userEmail = remaining.substring(firstQuote + 1, secondQuote).trim();
                    }
                }

                if (userEmail.isEmpty()) {
                    throw new IllegalArgumentException("Email payload missing.");
                }

                // Grab Mailjet credentials from Render environment
                String apiKey = System.getenv("MAILJET_API_KEY");
                String secretKey = System.getenv("MAILJET_SECRET_KEY");
                
                if (apiKey == null || secretKey == null) {
                    throw new IllegalStateException("Mailjet configuration keys are missing on Render.");
                }

                String emailHtmlContent = "<h1>Welcome to BMW Global Support & Diagnostic Portal</h1>"
                        + "<p>Hello,</p>"
                        + "<p>You have registered to our webpage successfully! Your driver profile session is now active.</p>"
                        + "<p><strong>System Baseline Status:</strong> Connected to Cloud Node Engine.</p>"
                        + "<br><p><em>Best regards,<br>BMW Support Systems Team</em></p>";

                // Building the JSON payload for Mailjet (Change the FromEmail to yours!)
               String mailjetPayload = "{"
                + "\"FromEmail\":\"your_verified_email@gmail.com\"," 
                + "\"FromName\":\"BMW Support Systems\","
                + "\"Subject\":\"Driver Profile Registration Success!\","
                + "\"html-part\":\"" + emailHtmlContent.replace("\"", "\\\"") + "\"," // Kept completely lowercase
                + "\"Recipients\":[{\"Email\":\"" + userEmail + "\"}]"
                + "}";

                // Basic Authentication header configuration
                String authString = apiKey + ":" + secretKey;
                String encodedAuth = Base64.getEncoder().encodeToString(authString.getBytes(StandardCharsets.UTF_8));

                // Send request out to Mailjet API
                HttpClient client = HttpClient.newHttpClient();
                HttpRequest emailRequest = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.mailjet.com/v3/send"))
                    .header("Authorization", "Basic " + encodedAuth)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(mailjetPayload))
                    .build();

                client.send(emailRequest, HttpResponse.BodyHandlers.ofString());

                String responseJson = "{\"status\":\"success\"}";
                byte[] responseBytes = responseJson.getBytes(StandardCharsets.UTF_8);
                exchange.getResponseHeaders().set("Content-Type", "application/json");
                exchange.sendResponseHeaders(200, responseBytes.length);
                OutputStream os = exchange.getResponseBody();
                os.write(responseBytes);
                os.close();

            } catch (Exception e) {
                e.printStackTrace();
                String errorMsg = "{\"error\":\"" + e.getMessage() + "\"}";
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
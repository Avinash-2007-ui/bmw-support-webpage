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
        server.createContext("/api/register", new RegisterEmailHandler());
        server.createContext("/api/login", new LoginEmailHandler());
        
        server.setExecutor(null);
        System.out.println("Secure BMW Java Backend actively listening on port: " + port);
        server.start();
    }

    // =========================================================================
    // 🔍 1. DIAGNOSE HANDLER CLASS (Chatbot Engine - Intact)
    // =========================================================================
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

    // =========================================================================
    // ✉️ 2. REGISTER EMAIL HANDLER CLASS (Robust Payload Extraction)
    // =========================================================================
    static class RegisterEmailHandler implements HttpHandler {
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
                    // =========================================================================
                    // ✅ FIXED BULLETPROOF EMAIL PARSING
                    // =========================================================================
                    String userEmail = "";
                if (requestBody.contains("\"email\"")) {
                    int startIdx = requestBody.indexOf("\"email\"");
                    // Slice everything AFTER the "email" key label
                    String remaining = requestBody.substring(startIdx + 7); 
    
                    // Dynamically locate the actual quote marks enclosing the value string
                    int firstQuote = remaining.indexOf("\"");
                    int secondQuote = remaining.indexOf("\"", firstQuote + 1);
    
                    if (firstQuote != -1 && secondQuote != -1) {
                    userEmail = remaining.substring(firstQuote + 1, secondQuote).trim();
                }
                    }

                    if (userEmail.isEmpty()) {
                        System.out.println("Registration Execution Blocked: Extracted Email Empty. Raw Payload: " + requestBody);
                        throw new IllegalArgumentException("Email payload missing.");
                    }

                    String apiKey = System.getenv("MAILJET_API_KEY");
                    String secretKey = System.getenv("MAILJET_SECRET_KEY");

                    String emailHtmlContent = "<h1>Welcome to BMW Global Support & Diagnostic Portal</h1>"
                            + "<p>Hello,</p>"
                            + "<p>You have registered to our webpage successfully! Your driver profile session is now active.</p>"
                            + "<p><strong>System Baseline Status:</strong> Connected to Cloud Node Engine.</p>"
                            + "<br><p><em>Best regards,<br>BMW Support Systems Team</em></p>";

                    String mailjetPayload = "{"
                            + "\"FromEmail\":\"avinashvyas2007@gmail.com\"," 
                            + "\"FromName\":\"BMW Support Systems\","
                            + "\"Subject\":\"Driver Profile Registration Success!\","
                            + "\"html-part\":\"" + emailHtmlContent.replace("\"", "\\\"") + "\","
                            + "\"Recipients\":[{\"Email\":\"" + userEmail + "\"}]"
                            + "}";

                    String authString = apiKey + ":" + secretKey;
                    String encodedAuth = Base64.getEncoder().encodeToString(authString.getBytes(StandardCharsets.UTF_8));

                    HttpClient client = HttpClient.newHttpClient();
                    HttpRequest emailRequest = HttpRequest.newBuilder()
                        .uri(URI.create("https://api.mailjet.com/v3/send"))
                        .header("Authorization", "Basic " + encodedAuth)
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(mailjetPayload))
                        .build();

                    HttpResponse<String> mpResponse = client.send(emailRequest, HttpResponse.BodyHandlers.ofString());
                    System.out.println("Mailjet Registration Dispatch Status: " + mpResponse.statusCode() + " | Response: " + mpResponse.body());

                    String responseJson = "{\"status\":\"success\"}";
                    byte[] responseBytes = responseJson.getBytes(StandardCharsets.UTF_8);
                    exchange.getResponseHeaders().set("Content-Type", "application/json");
                    exchange.sendResponseHeaders(200, responseBytes.length);
                    OutputStream os = exchange.getResponseBody();
                    os.write(responseBytes);
                    os.close();
                } catch (Exception e) {
                    e.printStackTrace();
                    String errJson = "{\"error\":\"" + e.getMessage() + "\"}";
                    byte[] errBytes = errJson.getBytes(StandardCharsets.UTF_8);
                    exchange.sendResponseHeaders(500, errBytes.length);
                    OutputStream os = exchange.getResponseBody();
                    os.write(errBytes);
                    os.close();
                }
            } else {
                exchange.sendResponseHeaders(405, -1);
            }
        }
    }

    // =========================================================================
    // ✉️ 3. NEW LOGIN EMAIL HANDLER CLASS (Robust Payload Extraction)
    // =========================================================================
    static class LoginEmailHandler implements HttpHandler {
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
                    // =========================================================================
                    // ✅ FIXED BULLETPROOF EMAIL PARSING
                    // =========================================================================
                    String userEmail = "";
                if (requestBody.contains("\"email\"")) {
                    int startIdx = requestBody.indexOf("\"email\"");
                    // Slice everything AFTER the "email" key label
                    String remaining = requestBody.substring(startIdx + 7); 
    
                     // Dynamically locate the actual quote marks enclosing the value string
                        int firstQuote = remaining.indexOf("\"");
                     int secondQuote = remaining.indexOf("\"", firstQuote + 1);
    
                    if (firstQuote != -1 && secondQuote != -1) {
                    userEmail = remaining.substring(firstQuote + 1, secondQuote).trim();
                    }
                }

                    if (userEmail.isEmpty()) {
                        System.out.println("Login Notification Blocked: Extracted Email Empty. Raw Payload: " + requestBody);
                        throw new IllegalArgumentException("Email payload missing.");
                    }

                    String apiKey = System.getenv("MAILJET_API_KEY");
                    String secretKey = System.getenv("MAILJET_SECRET_KEY");

                    String emailHtmlContent = "<h1>BMW Account Security Alert</h1>"
                            + "<p>Hello,</p>"
                            + "<p>A new login session was just authorized for your BMW Driver Portal account.</p>"
                            + "<p><strong>Security Log Details:</strong> Connection established successfully from Cloud Node.</p>"
                            + "<p>If this action was not performed by you, please modify your profile credentials immediately.</p>"
                            + "<br><p><em>Secure automated system dispatch,<br>BMW Identity Management</em></p>";

                    String mailjetPayload = "{"
                            + "\"FromEmail\":\"avinashvyas2007@gmail.com\"," 
                            + "\"FromName\":\"BMW Identity Security\","
                            + "\"Subject\":\"Security Alert: New Account Login Detected\","
                            + "\"html-part\":\"" + emailHtmlContent.replace("\"", "\\\"") + "\","
                            + "\"Recipients\":[{\"Email\":\"" + userEmail + "\"}]"
                            + "}";

                    String authString = apiKey + ":" + secretKey;
                    String encodedAuth = Base64.getEncoder().encodeToString(authString.getBytes(StandardCharsets.UTF_8));

                    HttpClient client = HttpClient.newHttpClient();
                    HttpRequest emailRequest = HttpRequest.newBuilder()
                        .uri(URI.create("https://api.mailjet.com/v3/send"))
                        .header("Authorization", "Basic " + encodedAuth)
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(mailjetPayload))
                        .build();

                    HttpResponse<String> mpResponse = client.send(emailRequest, HttpResponse.BodyHandlers.ofString());
                    System.out.println("Mailjet Login Dispatch Status: " + mpResponse.statusCode() + " | Response: " + mpResponse.body());

                    String responseJson = "{\"status\":\"success\"}";
                    byte[] responseBytes = responseJson.getBytes(StandardCharsets.UTF_8);
                    exchange.getResponseHeaders().set("Content-Type", "application/json");
                    exchange.sendResponseHeaders(200, responseBytes.length);
                    OutputStream os = exchange.getResponseBody();
                    os.write(responseBytes);
                    os.close();
                } catch (Exception e) {
                    e.printStackTrace();
                    String errJson = "{\"error\":\"" + e.getMessage() + "\"}";
                    byte[] errBytes = errJson.getBytes(StandardCharsets.UTF_8);
                    exchange.sendResponseHeaders(500, errBytes.length);
                    OutputStream os = exchange.getResponseBody();
                    os.write(errBytes);
                    os.close();
                }
            } else {
                exchange.sendResponseHeaders(405, -1);
            }
        }
    }
}
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
    // ✉️ 2. REGISTER EMAIL HANDLER (Resend Primary + Mailjet Fallback)
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
                        System.out.println("Registration Execution Blocked: Extracted Email Empty.");
                        throw new IllegalArgumentException("Email payload missing.");
                    }
                    
                    // Fixed Variable Declarations
                    String resendApiKey = System.getenv("RESEND_API_KEY");
                    String mailjetApiKey = System.getenv("MAILJET_API_KEY");
                    String mailjetSecretKey = System.getenv("MAILJET_SECRET_KEY");

                    String emailHtmlContent = """
                        <!DOCTYPE html>
                        <html>
                            <head>
                                <meta charset="UTF-8">
                                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            </head>
                            <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Helvetica Neue', Arial, sans-serif;">
                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0a0a0a; padding: 40px 20px;">
                                <tr>
                                    <td align="center">
                                        <table width="100%" style="max-width: 600px; background-color: #121212; border: 1px solid #222222; border-radius: 4px; overflow: hidden;">
                                            <tr>
                                                <td align="center" style="padding: 40px 40px 20px 40px; border-bottom: 1px solid #1a1a1a;">
                                                    <div style="font-size: 12px; font-weight: 700; letter-spacing: 0.25em; color: #ffffff; text-transform: uppercase;">
                                                        BMW GLOBAL SUPPORT & DIAGNOSTICS
                                                    </div>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 40px 50px;">
                                                    <h1 style="margin: 0 0 15px 0; font-size: 24px; font-weight: 300; color: #ffffff; text-align: center;">
                                                        Registration Confirmed
                                                    </h1>
                                                    <p style="margin: 0 0 30px 0; font-size: 14px; line-height: 1.6; color: #a0a0a0; text-align: center;">
                                                        Your driver profile session is now active. Connected to Cloud Node Engine.
                                                    </p>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td align="center" style="background-color: #0d0d0d; padding: 20px 40px; border-top: 1px solid #1a1a1a;">
                                                    <p style="margin: 0; font-size: 11px; letter-spacing: 0.05em; color: #444444;">
                                                        &copy; 2026 BMW Support Systems Team. Automated Transmission.
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                </table>
                            </body>
                        </html>
                        """;

                    String safeHtml = emailHtmlContent.replace("\"", "\\\"").replaceAll("[\\r\\n]+", "");    
                    HttpClient client = HttpClient.newHttpClient();
                    boolean emailSent = false;

                    // ATTEMPT 1: RESEND API
                    if (resendApiKey != null && !resendApiKey.isEmpty()) {
                        try {
                            System.out.println("Attempting to route registration email via Resend...");
                            String resendPayload = "{"
                                + "\"from\":\"BMW Support <noreply@bmwsupport.dedyn.io>\","
                                + "\"to\":[\"" + userEmail + "\"],"
                                + "\"subject\":\"Driver Profile Registration Success!\","
                                + "\"html\":\"" + safeHtml + "\""
                                + "}";

                            HttpRequest resendRequest = HttpRequest.newBuilder()
                                .uri(URI.create("https://api.resend.com/emails"))
                                .header("Authorization", "Bearer " + resendApiKey)
                                .header("Content-Type", "application/json")
                                .POST(HttpRequest.BodyPublishers.ofString(resendPayload))
                                .build();
                            
                            HttpResponse<String> resendResponse = client.send(resendRequest, HttpResponse.BodyHandlers.ofString());
            
                            if (resendResponse.statusCode() >= 200 && resendResponse.statusCode() < 300) {
                                System.out.println("✅ Success: Email dispatched via Resend Node.");
                                emailSent = true;
                            } else {
                                System.out.println("⚠️ Resend API Rejected: " + resendResponse.statusCode());
                            }
                        } catch (Exception re) {
                            System.out.println("⚠️ Resend Network Failure: " + re.getMessage());
                        }
                    }

                    // ATTEMPT 2: MAILJET API
                    if (!emailSent) {
                        System.out.println("🔄 Switching to Mailjet Fallback...");
                        String mailjetPayload = "{"
                                + "\"FromEmail\":\"noreply@bmwsupport.dedyn.io\"," 
                                + "\"FromName\":\"BMW Support Systems\","
                                + "\"Subject\":\"Driver Profile Registration Success!\","
                                + "\"html-part\":\"" + safeHtml + "\","
                                + "\"Recipients\":[{\"Email\":\"" + userEmail + "\"}]"
                                + "}";

                        String authString = mailjetApiKey + ":" + mailjetSecretKey;
                        String encodedAuth = Base64.getEncoder().encodeToString(authString.getBytes(StandardCharsets.UTF_8));

                        HttpRequest mailjetRequest = HttpRequest.newBuilder()
                            .uri(URI.create("https://api.mailjet.com/v3/send"))
                            .header("Authorization", "Basic " + encodedAuth)
                            .header("Content-Type", "application/json")
                            .POST(HttpRequest.BodyPublishers.ofString(mailjetPayload))
                            .build();

                        HttpResponse<String> mpResponse = client.send(mailjetRequest, HttpResponse.BodyHandlers.ofString());
                        
                        if (mpResponse.statusCode() >= 200 && mpResponse.statusCode() < 300) {
                             System.out.println("✅ Success: Email dispatched via Mailjet Fallback.");
                        } else {
                             throw new RuntimeException("All email nodes exhausted. Delivery failed.");
                        }
                    }

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
    // ✉️ 3. LOGIN EMAIL HANDLER (Resend Primary + Mailjet Fallback)
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
                        System.out.println("Login Notification Blocked: Extracted Email Empty.");
                        throw new IllegalArgumentException("Email payload missing.");
                    }

                    // Fixed Variable Declarations
                    String resendApiKey = System.getenv("RESEND_API_KEY");
                    String mailjetApiKey = System.getenv("MAILJET_API_KEY");
                    String mailjetSecretKey = System.getenv("MAILJET_SECRET_KEY");

                    String emailHtmlContent = "<h1>BMW Account Security Alert</h1>"
                            + "<p>Hello,</p>"
                            + "<p>A new login session was just authorized for your BMW Driver Portal account.</p>"
                            + "<p><strong>Security Log Details:</strong> Connection established successfully from Cloud Node.</p>"
                            + "<p>If this action was not performed by you, please modify your profile credentials immediately.</p>"
                            + "<br><p><em>Secure automated system dispatch,<br>BMW Identity Management</em></p>";

                    String safeHtml = emailHtmlContent.replace("\"", "\\\"").replaceAll("[\\r\\n]+", "");
                    HttpClient client = HttpClient.newHttpClient();
                    boolean emailSent = false;

                    // ATTEMPT 1: RESEND API
                    if (resendApiKey != null && !resendApiKey.isEmpty()) {
                        try {
                            System.out.println("Attempting to route login email via Resend...");
                            String resendPayload = "{"
                                + "\"from\":\"BMW Support <noreply@bmwsupport.dedyn.io>\","
                                + "\"to\":[\"" + userEmail + "\"],"
                                + "\"subject\":\"Security Alert: New Account Login Detected\"," // Fixed Subject
                                + "\"html\":\"" + safeHtml + "\""
                                + "}";

                            HttpRequest resendRequest = HttpRequest.newBuilder()
                                .uri(URI.create("https://api.resend.com/emails"))
                                .header("Authorization", "Bearer " + resendApiKey)
                                .header("Content-Type", "application/json")
                                .POST(HttpRequest.BodyPublishers.ofString(resendPayload))
                                .build();

                            HttpResponse<String> resendResponse = client.send(resendRequest, HttpResponse.BodyHandlers.ofString());
                            
                            if (resendResponse.statusCode() >= 200 && resendResponse.statusCode() < 300) {
                                System.out.println("✅ Success: Login email dispatched via Resend Node.");
                                emailSent = true;
                            } else {
                                System.out.println("⚠️ Resend API Rejected: " + resendResponse.statusCode());
                            }
                        } catch (Exception re) {
                            System.out.println("⚠️ Resend Network Failure: " + re.getMessage());
                        }
                    }

                    // ATTEMPT 2: MAILJET API
                    if (!emailSent) {
                        System.out.println("🔄 Switching to Mailjet Fallback...");
                        String mailjetPayload = "{"
                                + "\"FromEmail\":\"noreply@bmwsupport.dedyn.io\"," 
                                + "\"FromName\":\"BMW Identity Security\","
                                + "\"Subject\":\"Security Alert: New Account Login Detected\","
                                + "\"html-part\":\"" + safeHtml + "\","
                                + "\"Recipients\":[{\"Email\":\"" + userEmail + "\"}]"
                                + "}";

                        String authString = mailjetApiKey + ":" + mailjetSecretKey;
                        String encodedAuth = Base64.getEncoder().encodeToString(authString.getBytes(StandardCharsets.UTF_8));

                        HttpRequest mailjetRequest = HttpRequest.newBuilder()
                            .uri(URI.create("https://api.mailjet.com/v3/send"))
                            .header("Authorization", "Basic " + encodedAuth)
                            .header("Content-Type", "application/json")
                            .POST(HttpRequest.BodyPublishers.ofString(mailjetPayload))
                            .build();

                        HttpResponse<String> mpResponse = client.send(mailjetRequest, HttpResponse.BodyHandlers.ofString());
                        
                        if (mpResponse.statusCode() >= 200 && mpResponse.statusCode() < 300) {
                             System.out.println("✅ Success: Email dispatched via Mailjet Fallback.");
                        } else {
                             throw new RuntimeException("All email nodes exhausted. Delivery failed.");
                        }
                    }

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
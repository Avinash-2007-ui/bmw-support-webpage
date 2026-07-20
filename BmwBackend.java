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
import java.util.HashMap;
import java.util.Map;
/* 
public class BmwServer {
    
    // THE FILING CABINET: Stores Email -> Name
    // Example: "user@email.com" -> "Alex"
    private static Map<String, String> userDatabase = new HashMap<>();

    public static void main(String[] args) {
        // ... your server startup code ...
    }
    
    // --- INSIDE YOUR REGISTRATION HANDLER ---
    // When a user registers:
    userDatabase.put(extractedEmail, extractedName);
    
    // --- INSIDE YOUR LOGIN HANDLER ---
    // When a user logs in, retrieve the name using their email:
    String userName = userDatabase.get(extractedEmail);
    
    // Safety check just in case they aren't in the database
    if (userName == null) {
        userName = "Driver"; 
    }
    
    // Now inject 'userName' into your HTML template!
}*/
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

                    String emailHtmlContent = """
                    <!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Security Alert: New Login</title>
                            <!-- Reset styles for email clients -->
                        <style>
                            body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
                            table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
                            img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
                            table { border-collapse: collapse !important; }
                            body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
                        </style>
                    </head>
                    
                    <body style="background-color: #0a0a0a; margin: 0; padding: 0;">

                        <!-- 100% width background wrapper -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0a0a0a;">
                    <tr>
                        <td align="center" style="padding: 40px 10px 40px 10px;">
                
                             <!-- 600px Max Width Container -->
                                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #0a0a0a;">
                    
                                <!-- HEADER: Logo and Brand Name -->
                                <tr>
                                    <td align="left" style="padding: 20px 0px 30px 0px; border-bottom: 1px solid #222222;">
                                        <table border="0" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <!-- NOTE: Replace the src with the actual live URL of your logo image -->
                                            <td valign="middle" style="padding-right: 12px;">
                                                <img src="https://avinash-2007-ui.github.io/bmw-support-webpage/BMW-logo2.png" alt="BMW Logo" width="30" height="30" style="display: block; width: 30px; height: 30px;">
                                            </td>
                                            <td valign="middle">
                                                <span style="color: #ffffff; font-size: 14px; font-weight: 600; letter-spacing: 0.5px;">BMW Global Support & Diagnostic Guide</span>
                                            </td>
                                        </tr>
                    </table>
                        </td>
                    </tr>

                    <!-- MAIN CONTENT: Greeting -->
                    <tr>
                        <td align="left" style="padding: 40px 0px 20px 0px;">
                            <!-- Your Java backend will replace {{USER_NAME}} with the actual name -->
                            <h1 style="color: #ffffff; font-size: 28px; font-weight: bold; margin: 0;">Hey, {{USER_NAME}} 👋</h1>
                        </td>
                    </tr>

                    <!-- MAIN CONTENT: Message -->
                    <tr>
                        <td align="left" style="padding: 0px 0px 30px 0px;">
                            <p style="color: #a0a0a0; font-size: 16px; line-height: 24px; margin: 0;">
                                Hope you're doing well.<br><br>
                                A successful login was just detected on your account. If this was you, no further action is needed and you can safely ignore this message.
                            </p>
                        </td>
                    </tr>

                    <!-- THE DARK ACCENT CARD (Matches the Dribbble Design) -->
                    <tr>
                        <td align="left" style="padding: 25px; background-color: #141414; border: 1px solid #222222; border-radius: 8px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="left" style="padding-bottom: 15px;">
                                        <p style="color: #ffffff; font-size: 14px; font-weight: 600; margin: 0;">Unrecognized Activity?</p>
                                        <p style="color: #888888; font-size: 13px; line-height: 20px; margin: 5px 0 0 0;">
                                            If you did not authorize this login, we strongly suggest you urgently change your account credentials to secure your profile.
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="left">
                                        <table border="0" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td align="center" bgcolor="#ffffff" style="border-radius: 4px;">
                                                    <!-- Link this to your reset password/settings page -->
                                                    <a href="https://avinash-2007-ui.github.io/bmw-support-webpage/settings.html" target="_blank" style="font-size: 13px; font-weight: bold; color: #000000; text-decoration: none; padding: 10px 20px; border: 1px solid #ffffff; display: inline-block; border-radius: 4px;">SECURE ACCOUNT</a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- SIGN OFF -->
                    <tr>
                        <td align="left" style="padding: 30px 0px 40px 0px; border-bottom: 1px solid #222222;">
                            <p style="color: #a0a0a0; font-size: 16px; line-height: 24px; margin: 0;">
                                Have a great day ahead!<br>
                                <strong style="color: #ffffff;">BMW Support Team</strong>
                            </p>
                        </td>
                    </tr>

                    <!-- FOOTER -->
                    <tr>
                        <td align="left" style="padding: 20px 0px 20px 0px;">
                            <p style="color: #555555; font-size: 12px; line-height: 18px; margin: 0;">
                                You received this email because it is associated with a registered profile on the BMW Global Support portal. We will never ask for your password via email.
                                <br><br>
                                &copy; 2026 BMW Global Support. All rights reserved.
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
import axios from "axios";
import md5 from "md5"; // pour hasher le mot de passe si nécessaire

// --- Config SugarCRM ---
const CRM_REST_URL = "https://crm.icesco.org/service/v4_1/rest.php";
const USERNAME = "portal";
const PASSWORD = "Portal@2025"; // ou md5(PASSWORD)

// --- Fonction de login ---
async function login() {
  const passwordHash = md5(PASSWORD);
  const response = await axios.post(CRM_REST_URL, null, {
    params: {
      method: "login",
      input_type: "JSON",
      response_type: "JSON",
      rest_data: JSON.stringify({
        user_auth: {
          user_name: USERNAME,
          password: passwordHash,
        },
        application_name: "NodeCRMApp",
      }),
    },
  });

  const data = response.data;
  if (!data || !data.id) throw new Error("Login failed");
  return data.id;
}

// --- Récupérer tous les services ---
async function getAllServices(session_id) {
  const response = await axios.post(CRM_REST_URL, null, {
    params: {
      method: "get_entry_list",
      input_type: "JSON",
      response_type: "JSON",
      rest_data: JSON.stringify({
        session: session_id,
        module_name: "ms_service",
        query: "1=1", // récupère tous
        order_by: "name ASC",
        offset: 0,
        select_fields: ["id", "name", "description"],
        max_results: 1000,
      }),
    },
  });

  return response.data.entry_list || [];
}

// --- Récupérer les subservices d’un service ---
async function getSubservices(session_id, serviceId) {
    const response = await axios.post(CRM_REST_URL, null, {
      params: {
        method: "get_relationships",
        input_type: "JSON",
        response_type: "JSON",
        rest_data: JSON.stringify({
          session: session_id,
          module_name: "ms_service",               // ← corrigé
          module_id: serviceId,
          link_field_name: "ms_service_ms_subservice_1",
          related_module_query: "1=1",
          related_fields: ["id", "name"],          // test minimal
          deleted: 0,
          order_by: "",
          offset: 0,
          limit: 1000,
        }),
      },
    });
  
    return response.data.entry_list || [];
  }
  

// --- Main ---
async function main() {
  try {
    const session_id = await login();
    console.log("✅ Logged in, session:", session_id);

    const services = await getAllServices(session_id);
    console.log(`Found ${services.length} services`);

    const result = {};

    for (const service of services) {
      const serviceId = service.id;
      const serviceName = service.name_value_list.name.value;
      console.log(`\nService: ${serviceName} (ID: ${serviceId})`);

      const subservices = await getSubservices(session_id, serviceId);

      if (subservices.length === 0) {
        console.log("  No subservices");
        result[serviceId] = [];
        continue;
      }

      const formattedSubs = subservices.map((sub) => ({
        id: sub.id,
        name: sub.name_value_list.name?.value,
        name_ar_c: sub.name_value_list.name_ar_c?.value,
        name_fr_c: sub.name_value_list.name_fr_c?.value,
        description: sub.name_value_list.description?.value,
        description_subservice: sub.name_value_list.description_subservice?.value,
        description_subservice_ar_c: sub.name_value_list.description_subservice_ar_c?.value,
        description_subservice_fr_c: sub.name_value_list.description_subservice_fr_c?.value,
      }));

      result[serviceId] = formattedSubs;

      formattedSubs.forEach((sub) => {
        console.log(`  Subservice: ${sub.name} (ID: ${sub.id})`);
      });
    }

    console.log("\n✅ Final Result:");
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

main();

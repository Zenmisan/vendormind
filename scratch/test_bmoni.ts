import { BmoniService } from "../src/shared/bmoni.service";

async function main() {
  console.log("🧪 Testing BMONI Integration Service...");
  try {
    const testPhone = `+23480${Math.floor(10000000 + Math.random() * 90000000)}`;
    const testEmail = `test.vendor.${Date.now()}@vendormind.app`;

    console.log(`1. Provisioning BMONI User Stack (${testEmail}, ${testPhone})...`);
    const stack = await BmoniService.provisionUserStack("Test Vendor", testEmail, testPhone);

    console.log("✅ BMONI Stack Provisioned Successfully!");
    console.log("   User ID:", stack.bmoniUserId);
    console.log("   Smart Wallet ID:", stack.smartWalletId);
    console.log("   Smart Wallet Address:", stack.smartWalletAddress);
    console.log("   Virtual Account Number:", stack.depositAccountNumber);
    console.log("   Virtual Bank Name:", stack.depositBankName);

    console.log("\n2. Querying BMONI Balances...");
    const balances = await BmoniService.getWalletBalances(stack.bmoniUserId);
    console.log("✅ Balances:", JSON.stringify(balances));

  } catch (err: any) {
    console.error("❌ BMONI Test Error:", err.message);
  }
}

main();

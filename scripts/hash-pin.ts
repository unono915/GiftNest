import bcrypt from "bcryptjs";
import prompts from "prompts";

const MIN_PIN_LENGTH = 4;
const BCRYPT_COST = 12;

async function main() {
  const { pin } = await prompts({
    type: "password",
    name: "pin",
    message: "가족 공용 PIN을 입력하세요 (화면에 표시되지 않습니다)",
    validate: (value: string) =>
      value.length >= MIN_PIN_LENGTH ? true : `PIN은 최소 ${MIN_PIN_LENGTH}자리 이상이어야 합니다.`,
  });

  if (!pin) {
    console.error("PIN이 입력되지 않았습니다. 취소합니다.");
    process.exitCode = 1;
    return;
  }

  const { confirmPin } = await prompts({
    type: "password",
    name: "confirmPin",
    message: "PIN을 다시 입력하세요",
  });

  if (pin !== confirmPin) {
    console.error("입력한 PIN이 서로 일치하지 않습니다. 다시 실행해 주세요.");
    process.exitCode = 1;
    return;
  }

  const hash = await bcrypt.hash(pin, BCRYPT_COST);

  console.log("\n생성된 해시를 FAMILY_PIN_HASH 값으로 사용하세요.");
  console.log("로컬 개발: .env.local 파일의 FAMILY_PIN_HASH= 뒤에 붙여넣기");
  console.log("운영 환경: 호스팅 서비스의 Secret/Environment Variable로 등록\n");
  console.log(hash);
}

main().catch((error) => {
  console.error("해시 생성 중 오류가 발생했습니다.", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

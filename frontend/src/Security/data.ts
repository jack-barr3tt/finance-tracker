import { Category, CategoryRule, Transaction } from "../API/requests"
import { DecryptFunction } from "../Hooks/useUser"

export async function decryptCategoryRule<T extends CategoryRule | undefined>(
  rule: T,
  decrypt: DecryptFunction
): Promise<T> {
  if (!rule) return undefined as T

  const [description, ruleText] = await Promise.all([decrypt(rule.description), decrypt(rule.rule)])

  return {
    ...rule,
    description,
    rule: ruleText,
  }
}

export async function decryptCategory<T extends Category | undefined>(
  category: T,
  decrypt: DecryptFunction
): Promise<T> {
  if (!category) return undefined as T

  return {
    ...category,
    name: await decrypt(category.name),
    rules: await Promise.all(category.rules.map((rule) => decryptCategoryRule(rule, decrypt))),
  }
}

export async function decryptTransaction<T extends Transaction | undefined>(
  transaction: T,
  decrypt: DecryptFunction
): Promise<T> {
  if (!transaction) return undefined as T

  return {
    ...transaction,
    category: await decryptCategory(transaction.category, decrypt),
  }
}

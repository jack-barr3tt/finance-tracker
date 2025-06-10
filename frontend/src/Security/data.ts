import { Account, Category, CategoryRule, Transaction } from "../API/requests"
import { DecryptFunction } from "../Hooks/useUser"

export async function decryptCategoryRule<T extends CategoryRule | undefined>(
  rule: T,
  decrypt: DecryptFunction
): Promise<T> {
  if (!rule) return undefined as T

  const [description, ruleText, account] = await Promise.all([
    decrypt(rule.description),
    decrypt(rule.rule),
    decryptAccount(rule.account, decrypt),
  ])

  return {
    ...rule,
    description,
    rule: ruleText,
    account,
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

  const [description, category, account] = await Promise.all([
    decrypt(transaction.description),
    decryptCategory(transaction.category, decrypt),
    decryptAccount(transaction.account, decrypt),
  ])

  return {
    ...transaction,
    description,
    category,
    account,
  }
}

export async function decryptAccount<T extends Account | undefined>(
  account: T,
  decrypt: DecryptFunction
): Promise<T> {
  if (!account) return undefined as T

  return {
    ...account,
    name: await decrypt(account.name),
  }
}

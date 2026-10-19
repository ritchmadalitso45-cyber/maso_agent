// Model predictions and threat-feed evidence are labeled separately.
export function presentResult(result) {
  const isUrl = result.checks.model_type === 'url'
  if (result.safety_status === 'unsafe') return {
    tone: 'danger', title: 'Unsafe link', description: result.findings.filter(item => item.code === 'known_threat').map(item => item.message).join(' '),
    action: 'Do not open it or enter personal details. Use the company’s official app instead.',
    note: 'Matched a reported-threat source; separate from the AI prediction.',
  }
  if (result.safety_status === 'unverified') return {
    tone: 'caution', title: 'Live check unavailable', description: 'The requested website safety check could not be completed.',
    action: 'Avoid acting on unexpected requests until you can check with the sender.',
    note: 'The AI prediction is available, but the OpenPhish feed check did not complete.',
  }
  return {
    Safe: {
      tone: 'safe', title: isUrl ? 'Low-risk link' : 'Low-risk message',
      description: 'Low risk of a scam detected.',
      action: 'Confirm unexpected requests for money or personal details through a contact you trust.',
      note: result.checks.threat_intelligence === 'completed' ? 'No match in the completed threat checks. This does not guarantee safety.' : 'AI assessment only. This does not guarantee safety.',
    },
    Suspicious: {
      tone: 'caution', title: isUrl ? 'Suspicious link' : 'Suspicious message',
      description: 'This could be a scam. Do not proceed yet.',
      action: 'Contact the sender through a number or app you already trust.',
      note: 'Based on AI analysis of the submitted content.',
    },
    Dangerous: {
      tone: 'danger', title: isUrl ? 'High-risk link' : 'High-risk message',
      description: 'Strong signs of a scam. Do not proceed.',
      action: 'Do not pay or share passwords. Contact the sender through a number you already trust.',
      note: 'Based on AI analysis of the submitted content.',
    },
  }[result.risk_level]
}

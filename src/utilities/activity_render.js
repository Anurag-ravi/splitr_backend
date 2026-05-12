const sameId = (a, b) => !!a && !!b && a.toString() === b.toString();

const personRef = (recipientUserId, person) =>
  sameId(recipientUserId, person.userId) ? "You" : person.name;

const fmtMoney = (n) => {
  const fixed = Number(n).toFixed(2);
  return fixed.endsWith(".00") ? fixed.slice(0, -3) : fixed;
};

const sumAmountByTripUser = (entries) => {
  const map = new Map();
  for (const e of entries || []) {
    const key = e.user.toString();
    map.set(key, (map.get(key) || 0) + Number(e.amount || 0));
  }
  return map;
};

const expenseFinancialLine = (delta) => {
  if (delta > 0) {
    return { subtitle: `You get back ₹${fmtMoney(delta)}`, net: "+" };
  }
  if (delta < 0) {
    return { subtitle: `You owe ₹${fmtMoney(-delta)}`, net: "-" };
  }
  return { subtitle: "you owe nothing", net: "0" };
};

const renderExpenseAction = (ctx, verb) => {
  const { trip, actor, expense, entity_id, recipients } = ctx;
  const paidMap = sumAmountByTripUser(expense.paid_by);
  const shareMap = sumAmountByTripUser(expense.paid_for);
  return recipients.map((r) => {
    const paid = paidMap.get(r.tripUserId.toString()) || 0;
    const share = shareMap.get(r.tripUserId.toString()) || 0;
    const { subtitle, net } = expenseFinancialLine(paid - share);
    return {
      user: r.userId,
      trip: trip._id,
      action_type: ctx.action_type,
      entity_type: "expense",
      entity_id,
      category: expense.category || null,
      title: `${personRef(r.userId, actor)} ${verb} "${expense.name}" in "${trip.name}"`,
      subtitle,
      net,
    };
  });
};

const renderPaymentAction = (ctx, verb) => {
  const { trip, by, to, payment, entity_id, recipients } = ctx;
  return recipients.map((r) => {
    const isBy = by && sameId(r.userId, by.userId);
    const isTo = to && sameId(r.userId, to.userId);

    let subtitle = null;
    let net = "0";
    if (isBy) {
      subtitle = `You paid ₹${fmtMoney(payment.amount)}`;
      net = "-";
    } else if (isTo) {
      subtitle = `You received ₹${fmtMoney(payment.amount)}`;
      net = "+";
    }

    const byLabel = by ? personRef(r.userId, by) : "Someone";
    const toLabel = to ? personRef(r.userId, to) : "someone";
    const title =
      verb === "paid"
        ? `${byLabel} paid ${toLabel} ₹${fmtMoney(payment.amount)} in "${trip.name}"`
        : `${personRef(r.userId, ctx.actor)} ${verb} a payment in "${trip.name}"`;

    return {
      user: r.userId,
      trip: trip._id,
      action_type: ctx.action_type,
      entity_type: "payment",
      entity_id,
      category: null,
      title,
      subtitle,
      net,
    };
  });
};

const renderTripCreate = (ctx) => {
  const { trip, actor, entity_id, recipients } = ctx;
  return recipients.map((r) => ({
    user: r.userId,
    trip: trip._id,
    action_type: "trip_create",
    entity_type: "trip",
    entity_id,
    category: null,
    title: `${personRef(r.userId, actor)} created "${trip.name}"`,
    subtitle: null,
    net: "0",
  }));
};

const renderTripNameEdit = (ctx) => {
  const { trip, actor, rename, entity_id, recipients } = ctx;
  return recipients.map((r) => ({
    user: r.userId,
    trip: trip._id,
    action_type: "trip_name_edit",
    entity_type: "trip",
    entity_id,
    category: null,
    title: `${personRef(r.userId, actor)} edited "${rename.before}" to "${rename.after}"`,
    subtitle: null,
    net: "0",
  }));
};

const renderMemberJoinLeave = (ctx, verb) => {
  const { trip, actor, entity_id, recipients } = ctx;
  return recipients.map((r) => ({
    user: r.userId,
    trip: trip._id,
    action_type: verb === "joined" ? "member_join" : "member_leave",
    entity_type: "trip",
    entity_id,
    category: null,
    title: `${personRef(r.userId, actor)} ${verb} "${trip.name}"`,
    subtitle: null,
    net: "0",
  }));
};

const renderMemberAddRemove = (ctx, opts) => {
  const { trip, actor, target, entity_id, recipients } = ctx;
  return recipients.map((r) => {
    const isTarget = sameId(r.userId, target.userId);
    const targetLabel = isTarget ? "You" : target.name;
    const wasWere = isTarget ? "were" : "was";
    const actorLabel = personRef(r.userId, actor);
    return {
      user: r.userId,
      trip: trip._id,
      action_type: opts.action_type,
      entity_type: "trip",
      entity_id,
      category: null,
      title: `${targetLabel} ${wasWere} ${opts.verb} ${opts.preposition} ${trip.name} by ${actorLabel}`,
      subtitle: null,
      net: "0",
    };
  });
};

const renderExpenseComment = (ctx) => {
  const { trip, actor, expense, comment_body, entity_id, recipients } = ctx;
  return recipients.map((r) => ({
    user: r.userId,
    trip: trip._id,
    action_type: "expense_comment",
    entity_type: "expense",
    entity_id,
    category: expense.category || null,
    title: `${personRef(r.userId, actor)} commented on "${expense.name}" in "${trip.name}"`,
    subtitle: comment_body || null,
    net: "0",
  }));
};

const renderPaymentComment = (ctx) => {
  const { trip, actor, comment_body, entity_id, recipients } = ctx;
  return recipients.map((r) => ({
    user: r.userId,
    trip: trip._id,
    action_type: "payment_comment",
    entity_type: "payment",
    entity_id,
    category: null,
    title: `${personRef(r.userId, actor)} commented on a payment in "${trip.name}"`,
    subtitle: comment_body || null,
    net: "0",
  }));
};

const renderActivityRows = (ctx) => {
  switch (ctx.action_type) {
    case "expense_create":
      return renderExpenseAction(ctx, "added");
    case "expense_update":
      return renderExpenseAction(ctx, "updated");
    case "expense_delete":
      return renderExpenseAction(ctx, "deleted");
    case "payment_create":
      return renderPaymentAction(ctx, "paid");
    case "payment_update":
      return renderPaymentAction(ctx, "updated");
    case "payment_delete":
      return renderPaymentAction(ctx, "deleted");
    case "trip_create":
      return renderTripCreate(ctx);
    case "trip_name_edit":
      return renderTripNameEdit(ctx);
    case "member_join":
      return renderMemberJoinLeave(ctx, "joined");
    case "member_leave":
      return renderMemberJoinLeave(ctx, "left");
    case "member_add":
      return renderMemberAddRemove(ctx, {
        action_type: "member_add",
        verb: "added",
        preposition: "to",
      });
    case "member_remove":
      return renderMemberAddRemove(ctx, {
        action_type: "member_remove",
        verb: "removed",
        preposition: "from",
      });
    case "expense_comment":
      return renderExpenseComment(ctx);
    case "payment_comment":
      return renderPaymentComment(ctx);
    default:
      throw new Error(`Unknown action_type: ${ctx.action_type}`);
  }
};

module.exports = {
  renderActivityRows,
  fmtMoney,
};

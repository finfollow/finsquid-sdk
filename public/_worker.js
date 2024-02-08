import { Resend } from "resend";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "*",
  "Access-Control-Allow-Headers": "*",
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/sendOverview")) {
      const { RESEND_KEY, GATEWAY_URL: apiUrl } = env;
      console.log("env: ", env);
      try {
        const authorization = request.headers.get("Authorization");
        console.log("authorization: ", authorization);
        const body = await request.json();
        console.log("body: ", body);
        const sids = body.sids;

        const accounts = await getAccounts({ apiUrl, authorization, sids });
        console.log("accounts: ", accounts);
        const loans = await getLoans({ apiUrl, authorization, sids });
        const accountsWithPositions = await getAccountsWithPositions({
          apiUrl,
          authorization,
          accounts: accounts.filter(
            (el) => el.type === "INVESTMENT" || el.type === "PENSION"
          ),
        });

        if (!accounts?.length || !loans?.length)
          return new Response(
            JSON.stringify(
              "Something went wrong, couldn't get any accounts to send"
            ),
            {
              status: 500,
              headers: corsHeaders,
            }
          );

        const accountsData = {};
        accounts
          ?.map((el) => el.type)
          .filter((el, i, array) => array.indexOf(el) === i)
          .forEach((category) => {
            accountsData[category] = accounts.filter(
              (el) => el.type === category
            );
          });

        const accountType = {
          INVESTMENT: "Investment Accounts",
          BANKACCOUNT: "Bank Accounts",
          PENSION: "Pension",
        };

        const doc = new jsPDF();

        // Set initial Y position
        let positionY = 14;
        doc.setTextColor(0, 0, 0);
        doc.text(
          "Financial Overview",
          doc.internal.pageSize.width / 2,
          positionY,
          null,
          null,
          "center"
        );
        positionY += 10;
        doc.setFontSize(10);

        doc.text(`Full Name: ${body.fullname}`, 10, positionY);
        positionY += 4;
        doc.text(`Personnummer: ${body.ssn}`, 10, positionY);
        positionY += 6;

        const colorHeaderHeight = 13;
        // Function to draw a section title above the header
        const drawSectionTitle = (title, x, y) => {
          doc.setTextColor(0, 0, 0); // Black text
          // doc.setFont("helvetica", 12, "bold");
          doc.text(title, x, y);
        };

        // Function to draw a section header with labels and values
        const drawSectionHeader = (totals, x, y, width, height) => {
          doc.setFillColor(125, 1, 255); // Purple background
          doc.setTextColor(255, 255, 255); // White text
          // doc.setFont("helvetica", 12, 400);
          doc.rect(x, y, width, height, "F");
          doc.setFontSize(10);

          const labelYOffset = y + 5; // Position of the label from the top of the header
          const valueYOffset = y + 10; // Position of the value from the top of the header

          if (totals.Cash !== undefined) {
            doc.setTextColor(218, 191, 255);
            // doc.setFont("helvetica", 12, 400);
            doc.text("Cash", x + 5, labelYOffset);
            doc.setTextColor(255, 255, 255);
            // doc.setFont("helvetica", 12, 700);
            doc.text(totals.Cash, x + 5, valueYOffset);
          }

          if (totals.Invested !== undefined) {
            const center = width / 2;
            doc.setTextColor(218, 191, 255);
            // doc.setFont("helvetica", 12, 400);
            doc.text("Invested", center, labelYOffset);
            doc.setTextColor(255, 255, 255);
            // doc.setFont("helvetica", 12, 700);
            doc.text(totals.Invested, center, valueYOffset);
          }

          if (totals["Interest rate"] !== undefined) {
            const center = width / 2;
            doc.setTextColor(218, 191, 255);
            // doc.setFont("helvetica", 12, 400);
            doc.text("Interest rate", center, labelYOffset);
            doc.setTextColor(255, 255, 255);
            // doc.setFont("helvetica", 12, 700);
            doc.text(totals["Interest rate"], center, valueYOffset);
          }

          const totalXPosition = x + width - 40;
          doc.setTextColor(218, 191, 255);
          doc.text("Total", totalXPosition, labelYOffset);
          doc.setTextColor(255, 255, 255);
          doc.text(totals.Total, totalXPosition, valueYOffset);
        };

        // Function to draw a section table
        const drawSectionDetails = ({ head, body, startY }) => {
          const tableOptions = {
            startY,
            theme: "plain",
            headStyles: { fillColor: [200, 200, 200] },
            bodyStyles: { fillColor: [242, 242, 242] },
            margin: { top: 0, left: 10 },
            styles: { cellPadding: 1, fontSize: 10 },
            tableWidth: doc.internal.pageSize.width - 20,
          };

          doc.autoTable({
            head,
            body,
            ...tableOptions,
          });
        };

        // Draw headers and account details for each section
        Object.keys(accountsData).forEach((section) => {
          // Calculate totals
          const totalAmount = accountsData[section].reduce(
            (total, acc) => {
              total.amt += acc.totalValue?.amt || 0;
              if (!total.cy && acc.totalValue?.cy)
                total.cy = acc.totalValue?.cy;
              return total;
            },
            { amt: 0, cy: undefined }
          );
          const totalBalance = accountsData[section].reduce(
            (total, acc) => {
              total.amt += acc.balance?.amt || 0;
              if (!total.cy && acc.balance?.cy) total.cy = acc.balance?.cy;
              return total;
            },
            { amt: 0, cy: undefined }
          );

          const totals = {
            Total: currencyValue(totalAmount, { fractionDigits: 0 }),
          };

          if (section === "INVESTMENT") {
            totals.Cash = currencyValue(totalBalance, { fractionDigits: 0 });
            totals.Invested = currencyValue(
              {
                amt: totalAmount.amt - totalBalance.amt,
                cy: totalAmount.cy,
              },
              {
                fractionDigits: 0,
              }
            );
          }

          positionY += 4;
          drawSectionTitle(accountType[section], 10, positionY);
          positionY += 3;
          drawSectionHeader(
            totals,
            10,
            positionY,
            doc.internal.pageSize.width - 20,
            colorHeaderHeight
          );
          positionY += colorHeaderHeight;

          drawSectionDetails({
            head: [
              [
                "Account",
                "Type",
                {
                  content: "Amount",
                  styles: { halign: "right" },
                },
              ],
            ],
            body: accountsData[section]?.map((account) => [
              account.name,
              account.subType,
              {
                content: currencyValue(account.totalValue),
                styles: { halign: "right", fontStyle: "bold" },
              },
            ]),
            startY: positionY,
          });
          positionY = doc.autoTable.previous.finalY + 5;
        });

        // Draw header and details for loans section
        let interest = 0;
        let totalLoan = 0;

        const totals = {
          Total: currencyValue(
            loans.reduce(
              (total, loan) => {
                total.amt += loan.balance.amt || 0;
                if (!total.cy && loan.balance.cy) total.cy = loan.balance.cy;
                return total;
              },
              { amt: 0, cy: undefined }
            ),
            { fractionDigits: 0 }
          ),
          "Interest rate": percentValue(getLoansInterestRate(loans)),
        };
        positionY += 2;
        drawSectionTitle("Loans", 10, positionY);
        positionY += 3;
        drawSectionHeader(
          totals,
          10,
          positionY,
          doc.internal.pageSize.width - 20,
          colorHeaderHeight
        );
        positionY += colorHeaderHeight;
        drawSectionDetails({
          head: [
            [
              "Loan",
              "Type",
              {
                content: "Interest %",
                styles: { halign: "right" },
              },
              {
                content: "Amount",
                styles: { halign: "right" },
              },
            ],
          ],
          body: loans?.map((loan) => [
            loan.name,
            loan.type,
            {
              content: percentValue(loan.interestRate),
              styles: { halign: "right" },
            },
            {
              content: currencyValue(loan.balance),
              styles: { halign: "right", fontStyle: "bold" },
            },
          ]),
          startY: positionY,
        });
        positionY = doc.autoTable.previous.finalY + 5;

        // Draw account details pages
        accountsWithPositions.forEach((accountDetails) => {
          doc.addPage();
          positionY = 10;
          // Calculate totals
          const totals = {
            Cash: currencyValue(accountDetails?.account?.balance, {
              fractionDigits: 0,
            }),
            Invested: currencyValue(
              {
                amt:
                  accountDetails?.account?.totalValue?.amt &&
                  accountDetails?.account?.totalValue?.amt -
                    (accountDetails?.account?.balance?.amt || 0),
                cy: accountDetails?.account?.totalValue?.cy,
              },
              { fractionDigits: 0 }
            ),
            Total: currencyValue(accountDetails?.account?.totalValue, {
              fractionDigits: 0,
            }),
          };
          positionY += 4;

          const accountName =
            accountDetails?.account?.providerAccountNumber ===
            accountDetails?.account?.name
              ? accountDetails?.account?.name
              : `${accountDetails?.account?.name || ""} - ${
                  accountDetails?.account?.providerAccountNumber || ""
                }`;

          drawSectionTitle(accountName, 10, positionY);
          positionY += 3;
          drawSectionHeader(
            totals,
            10,
            positionY,
            doc.internal.pageSize.width - 20,
            colorHeaderHeight
          );
          positionY += colorHeaderHeight;

          const totalAmount = accountDetails?.positions?.reduce(
            (sum, pos) => sum + (pos.marketValueAC?.amt || 0),
            0
          );
          drawSectionDetails({
            head: [
              [
                "Name",
                {
                  content: "Quantity",
                  styles: { halign: "right" },
                },
                {
                  content: "Latest",
                  styles: { halign: "right" },
                },
                {
                  content: "Return %",
                  styles: { halign: "right" },
                },
                {
                  content: "Amount",
                  styles: { halign: "right" },
                },
                {
                  content: "Share",
                  styles: { halign: "right" },
                },
              ],
            ],
            body: accountDetails?.positions?.map((pos) => [
              pos?.instrument?.name,
              {
                content: Math.round(pos?.quantity),
                styles: { halign: "right" },
              },
              {
                content: currencyValue(pos?.lastPrice, { fractionDigits: 2 }),
                styles: { halign: "right" },
              },
              {
                content: percentValue(pos?.pctReturn),
                styles: {
                  halign: "right",
                  textColor:
                    pos?.pctReturn > 0
                      ? "green"
                      : pos?.pctReturn < 0
                      ? "red"
                      : "black",
                },
              },
              {
                content: currencyValue(pos?.marketValueAC, {
                  fractionDigits: 0,
                }),
                styles: { halign: "right", fontStyle: "bold" },
              },
              {
                content: percentValue(
                  (pos?.marketValueAC.amt || 0) / totalAmount
                ),
                styles: { halign: "right" },
              },
            ]),
            startY: positionY,
          });
          positionY = doc.autoTable.previous.finalY + 5;
        });

        const pdfBuffer = arrayBufferToBase64(doc.output("arraybuffer"));

        const resend = new Resend(RESEND_KEY);
        const { data, error } = await resend.emails.send({
          from: "onboarding@resend.dev",
          to: [body.email],
          subject: "Financial Overview Report",
          html: `<p>Hello!</p><p>${body.fullname} - ${body.ssn} report in the attachment.</p>`,
          attachments: [
            {
              filename: `${body.ssn}-report.pdf`,
              content: pdfBuffer,
            },
          ],
        });

        if (error) {
          return new Response(JSON.stringify(error), {
            status: 500,
            headers: corsHeaders,
          });
        }
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: corsHeaders,
        });
      } catch (err) {
        console.log("err: ", err);
        return new Response(JSON.stringify(err), {
          status: 500,
          headers: corsHeaders,
        });
      }
    }
    // Otherwise, serve the static assets.
    // Without this, the Worker will error and no assets will be served.
    return env.ASSETS.fetch(request);
  },
};

function arrayBufferToBase64(arrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(arrayBuffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function getAccountsWithPositions({ apiUrl, authorization, accounts }) {
  const request = (sid, accountId) =>
    fetch(`${apiUrl}/v1/accounts/${accountId}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: authorization,
        sid,
      },
    }).then((res) => res.json());

  const accountsRes = await Promise.allSettled(
    accounts?.map((account) => request(account.sid, account.providerAccountId))
  );

  const fulfilledRes = accountsRes.filter((el) => el.status === "fulfilled");

  if (!fulfilledRes.length) return [];

  const result = fulfilledRes.flatMap((el) => el.value);

  return result;
}

async function getAccounts({ apiUrl, authorization, sids }) {
  const request = async (sid) => {
    const res = await fetch(`${apiUrl}/v1/accounts`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: authorization,
        sid,
      },
    });
    const resJson = await res.json();
    return resJson.accounts?.map((acc) => ({ ...acc, sid }));
  };

  const accountsRes = await Promise.allSettled(
    sids?.map((sid) => request(sid))
  );

  const fulfilledRes = accountsRes.filter((el) => el.status === "fulfilled");

  if (!fulfilledRes.length) return [];

  const accounts = fulfilledRes.flatMap((el) => el.value);

  return accounts;
}

async function getLoans({ apiUrl, authorization, sids }) {
  const request = (sid) =>
    fetch(`${apiUrl}/v1/loans`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: authorization,
        sid,
      },
    }).then((res) => res.json());

  const loansRes = await Promise.allSettled(sids?.map((sid) => request(sid)));
  const fulfilledRes = loansRes.filter((el) => el.status === "fulfilled");
  if (!fulfilledRes.length) return [];

  const loans = fulfilledRes
    .flatMap((result) => result.value)
    ?.flatMap((loan) =>
      loan?.loanParts?.length
        ? loan.loanParts.map((part) => ({
            ...part,
            provider: loan.provider,
            type: loan.type,
          }))
        : []
    );

  return loans;
}

const getLoansInterestRate = (loans) => {
  const totalWeightedInterest = loans?.reduce(
    (total, loan) =>
      total + (loan?.balance?.amt || 0) * (loan?.interestRate || 0),
    0
  );
  const totalBalance = loans?.reduce(
    (total, loan) => total + (loan?.balance?.amt || 0),
    0
  );
  return totalWeightedInterest / (totalBalance || 1);
};

const currencyValue = (m, options) => {
  return m?.amt
    ? Intl.NumberFormat("sv", {
        style: m?.cy ? "currency" : "decimal",
        currency: m?.cy || undefined,
        maximumFractionDigits: options?.fractionDigits ?? 2,
        minimumFractionDigits: options?.fractionDigits ?? 2,
        currencyDisplay: "code",
        notation: (m?.amt || 0) > 99999999 ? "compact" : "standard",
        ...options,
      }).format(m?.amt || 0)
    : "-";
};

const percentValue = (val, fractionDigits = 2) =>
  val ? (val * 100).toFixed(fractionDigits) + " %" : "0 %";

import cron from 'node-cron';
import fs from 'fs';
import { db } from './models';
import nodemailer from 'nodemailer';
import puppeteer from 'puppeteer';
import { Op } from 'sequelize';

const generateInvoice = (property, bookings, totalAmount) => {
  const groupedBookings = bookings.reduce((acc, booking) => {
    const mode = booking.source;
    if (!acc[mode]) {
      acc[mode] = [];
    }
    acc[mode].push(booking);
    return acc;
  }, {});

  let bookingDetailsHtml = '';
  let totalAmountWithExtraCharges = 0;
  Object.keys(groupedBookings).forEach(mode => {
    const modeBookings = groupedBookings[mode];
    let modeBookingDetails = '';
    let BookingAmountTotal = 0;
    // let totalAmountWithExtraCharges = 0;
    modeBookings.forEach(booking => {
      const extraCharges1 = JSON.parse(booking.extraCharge1) || [];
      const extraChargesTotal1 = extraCharges1.reduce((sum, charge) => sum + parseInt(charge.price, 10), 0);

      const extraCharges = JSON.parse(booking.extraCharge2) || [];
      const extraChargesTotal = extraCharges.reduce((sum, charge) => sum + parseInt(charge.price, 10), 0);
      const totalBookingAmount = parseInt(booking.bookingAmout, 10) + extraChargesTotal + extraChargesTotal1;

      BookingAmountTotal += parseInt(booking.bookingAmout, 10);
      totalAmountWithExtraCharges += totalBookingAmount;

      let cgst = (parseInt(booking.bookingAmout, 10) * 6) / 100;
      let sgst = (parseInt(booking.bookingAmout, 10) * 6) / 100;

      modeBookingDetails += `
        <tr>
          <td style="font-size:10px">${booking.bookingCode}</td>
          <td style="font-size:10px">${booking.fromDate} - ${booking.toDate}</td>
          <td style="text-align:right; font-size:10px">${booking.bookingAmout}</td>
          <td style="font-size:10px">
            ${extraCharges.map(charge => `<div>${charge.types}: ${charge.price}</div>`).join('')}
          </td>
          <td style="font-size:10px">
            ${extraCharges1.map(charge => `<div>${charge.types}: ${charge.price}</div>`).join('')}
          </td>
          <td style="text-align:right;font-size:10px">${cgst}</td>
          <td style="text-align:right;font-size:10px">${sgst}</td>
          <td style="text-align:right;font-size:10px">${totalBookingAmount}</td>
          <td style="font-size:10px">${booking.paymentMode == 0 && "Pay At Hotel" || booking.paymentMode == 1 && "UPI" || booking.paymentMode == 2 && "Cash" || booking.paymentMode == 3 && "Card" || booking.paymentMode == 4 && "FOC" || booking.paymentMode == 5 && "Prepaid" || booking.paymentMode == 6 && "Paylater"}</td>
        </tr>`;
    });

    bookingDetailsHtml += `
      <h4 style="padding:0px;margin-bottom:0px">Source: ${mode}</h4>
      <table border="1" style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="padding: 8px; border: 1px solid #ddd;font-size:10px">Booking Code</th>
            <th style="padding: 8px; border: 1px solid #ddd;font-size:10px">Booking Dates</th>
            <th style="padding: 8px; border: 1px solid #ddd;font-size:10px">Booking Amount</th>
            <th style="padding: 8px; border: 1px solid #ddd;font-size:10px">Extra Charges</th>
            <th style="padding: 8px; border: 1px solid #ddd;font-size:10px">Extra Charges</th>
            <th style="padding: 8px; border: 1px solid #ddd;font-size:10px">SGST <br><span style="font-weight:normal"> 6.00%</span></th>
            <th style="padding: 8px; border: 1px solid #ddd;font-size:10px">CGST <br><span style="font-weight:normal"> 6.00%</span></th>
            <th style="padding: 8px; border: 1px solid #ddd;font-size:10px">Total Amount</th>
            <th style="padding: 8px; border: 1px solid #ddd;font-size:10px">Payment Mode</th>
          </tr>
        </thead>
        <tbody>
          ${modeBookingDetails}
        </tbody>
        <tfoot>
            <tr>
                <td colspan="2" style="font-size:12px">Total Booking Amount:</td>
                <td style="font-weight:bold;text-align:right; font-size:12px">${BookingAmountTotal}</td>
                <td></td>
                <td></td>
                <td colspan="2" style="font-size:12px">Total Amount:</td>
                <td style="font-weight:bold;text-align:right;font-size:12px">${totalAmountWithExtraCharges}</td>
            </tr>
        </tfoot>
      </table>
      <h3>Total booking amount by <u>${mode}</u>: ₹${modeBookings.reduce((sum, booking) => sum + parseFloat(booking.bookingAmout), 0)}</h3>
    `;
  });

  // Return the full HTML invoice
  return `
  <div style="font-family:arial">
  <div style="text-align: center">
    <h1 style="padding:0px;margin:0px">${property.name}</h1>
    <p style="padding:0px;margin:0px"><strong>Property Code:</strong> ${property.propertyCode}</p>
    <p style="padding:0px;margin:0px"><strong>GST Number:</strong> ${property.gstNumber}</p>
    <p style="padding:0px;margin:0px"><strong>Address:</strong> ${property.address}</p>
    <p style="padding:0px;margin:0px"><strong>Owner:</strong> ${property.ownerName}</p>
    <p style="padding:0px;margin:0px"><strong>Contact:</strong> ${property.ownerEmail}</p>
    <p style="padding:0px;margin:0px"><strong>Month:</strong> ${new Date().toLocaleString('default', { month: 'long' })}</p>
    </div>
    ${bookingDetailsHtml}
    
    <h2>Overall Total: ₹${totalAmountWithExtraCharges}</h2>
    
    <div style="margin-top: 20px;">
      <p><strong>Terms and Conditions:</strong></p>
      <ul>
        <li>Couples are welcome, and guests can check in using any local or outstation ID proof (PAN card not accepted).</li>
        <li>Booking amount is due at the time of check-in unless specified otherwise.</li>
        <li>Cancellation policy applies as per the hotel’s terms.</li>
      </ul>
    </div>
    </div>
  `;
};

// Schedule a cron job to run on the 1st day of every month at midnight
cron.schedule('0 0 1 * *', async () => {
  // cron.schedule('1 * * * * *', async () => {
  console.log('Generating invoices for previous month...');

  const currentDate = new Date();
  const firstDayPrevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
  const lastDayPrevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);

  // const firstDay = firstDayPrevMonth.toISOString().slice(0, 10);
  // const lastDay = lastDayPrevMonth.toISOString().slice(0, 10);

  const formatDate = (date) => {
    const yyyy = date.getFullYear();
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    const dd = date.getDate().toString().padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };
  const firstDay = formatDate(firstDayPrevMonth);
  const lastDay = formatDate(lastDayPrevMonth);

  const properties = await db.PropertyMaster.findAll();

  for (let property of properties) {
    const bookings = await db.BookingHotel.findAll({
      where: {
        propertyId: property.id,
        fromDate: { [Op.gte]: '2023-12-01' },
        toDate: { [Op.lte]: '2023-12-31' },
        // fromDate: { [Op.gte]: firstDay },
        // toDate: { [Op.lte]: lastDay },
        bookingStatus: '3',
        source: 'RRooms'
      }
    });

    if (bookings.length > 0) {
      const totalAmount = bookings.reduce((sum, booking) => sum + parseFloat(booking.bookingAmout), 0);

      const invoiceDetails = generateInvoice(property, bookings, totalAmount);
      // console.log('invoiceDetails -', invoiceDetails);
      const formattedName = property?.name.toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');
      console.log(formattedName);

      const formattedMonthYear = new Date(firstDay).toLocaleString('default', { month: 'long', year: 'numeric' }).replace(' ', '_').toLowerCase();

      const outputPath = `./invoices/invoice_${formattedName}_${formattedMonthYear}.pdf`;
      await generatePDF(invoiceDetails, outputPath);
      await sendInvoiceEmail(property, invoiceDetails, totalAmount, outputPath);
    }
  }
});

const generatePDF = async (htmlContent, outputPath) => {
  const dir = './invoices';
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Set content and page size (A4)
    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });

    // Generate PDF with A4 size and margin (via @page in styles)
    await page.pdf({ path: outputPath, format: 'A4', margin: { top: '25mm', bottom: '25mm', left: '20mm', right: '20mm' } });

    await browser.close();
    console.log('PDF created successfully:', outputPath);
  } catch (error) {
    console.error('Error generating PDF:', error);
  }
};


const generatePDF2 = async (htmlContent, outputPath) => {
  const dir = './invoices';  // Corrected directory path
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Set content and page size (A4)
    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });

    // Define CSS styles for page breaks
    const pageStyles = `
      <style>
  body {
    margin: 20px;
    padding: 0;
    font-family: Arial, sans-serif;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    page-break-inside: auto; /* Avoid breaking inside a table */
    margin-bottom: 20px;
  }
  th, td {
    padding: 8px;
    border: 1px solid #ddd;
  }
  thead {
    background-color: #f0f0f0;
  }
  /* Allow page break only if needed, avoid forcing after every table */
  .page-break {
    page-break-before: always;
  }

  /* Avoid breaking a table in the middle */
  table {
    page-break-inside: auto;
  }

  /* If you want a manual page break after specific content, you can use this */
  .manual-break {
    page-break-before: always;
  }

  /* Add padding to each page content (for PDFs in puppeteer) */
  @page {
    margin: 20mm;  /* Set the margin of the page, this works for PDF output */
  }
</style>

    `;

    // Inject styles into the document
    await page.setContent(pageStyles + htmlContent);

    // Generate PDF
    await page.pdf({ path: outputPath, format: 'A4' });

    await browser.close();
    console.log('PDF created successfully:', outputPath);
  } catch (error) {
    console.error('Error generating PDF:', error);
  }
};


async function sendInvoiceEmail(property, invoiceDetails, totalAmount, outputPath) {
  const formattedMonthYear = new Date().toLocaleString('default', { month: 'long', year: 'numeric' }).replace(' ', '_').toLowerCase();
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: 'sid11jan.hashtaglabs@gmail.com',
      pass: 'jdxatylhqnxrbzeo'
    }
  });
  const mailOptions = {
    from: 'sid11jan.hashtaglabs@gmail.com',
    // to: property.ownerEmail,
    to: 'vishwas@yopmail.com',
    subject: `Invoice for ${property.name} - ${formattedMonthYear}`,
    html: invoiceDetails,
    attachments: [
      {
        filename: `invoice_${property.name}_${formattedMonthYear}.pdf`,
        path: outputPath, // Attach the generated PDF
      }
    ]
  };
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Invoice sent: ' + info.response);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}


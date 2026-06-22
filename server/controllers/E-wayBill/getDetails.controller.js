// const {
//   getEwayBillDetails,
// } = require("../../services/ewb.service");

// exports.getEWBDetailsController =
//   async (req, res) => {
//     try {
//       const EWB =
//         getEWB(req);

//       const {
//         ewayBillNo,
//       } = req.params;

//       const ewbDoc =
//         await EWB.findOne({
//           ewayBillNo:
//             String(
//               ewayBillNo
//             ),
//         });

//       if (!ewbDoc) {
//         return res
//           .status(404)
//           .json({
//             success: false,
//             message:
//               "EWB not found",
//           });
//       }

//       const result =
//         await getEwayBillDetails(
//           ewbDoc.userGstin ||
//             ewbDoc.customerGSTIN,
//           ewayBillNo
//         );

//       return res.json({
//         success: true,
//         data: result,
//       });

//     } catch (err) {
//       return res
//         .status(500)
//         .json({
//           success: false,
//           message:
//             err.response
//               ?.data ||
//             err.message,
//         });
//     }
//   };
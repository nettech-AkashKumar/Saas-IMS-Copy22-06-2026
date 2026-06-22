import Swal from "sweetalert2";

const DeleteAlert = async ({
  title = "Confirm Delete?",
  text = "Are you sure want to delete?",
  confirmButtonText = "Delete",
  confirmButtonColor = "#3085d6",
  cancelButtonColor = "#d33",
  icon = "warning",
}) => {
  const result = await Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonColor,
    cancelButtonColor,
    confirmButtonText,
  });

  return result.isConfirmed;
};

export default DeleteAlert;



